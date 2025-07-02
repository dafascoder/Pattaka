import {
	IconActivity,
	IconAlertTriangle,
	IconCheck,
	IconClock,
	IconPlayerStop,
	IconX,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { executionService } from "@/services/execution-service";
import type { ExecutionStep } from "@/types/api";

interface WorkflowExecutionOverlayProps {
	workflowId: string;
	executionId: string | null;
	nodes: Array<{
		id: string;
		position: { x: number; y: number };
		data: Record<string, any>;
	}>;
	isVisible: boolean;
}

interface NodeExecutionStatus {
	nodeId: string;
	status: "pending" | "running" | "completed" | "failed" | "skipped";
	startTime?: string;
	endTime?: string;
	duration?: number;
	error?: string;
	stepData?: ExecutionStep;
}

export function WorkflowExecutionOverlay({
	workflowId,
	executionId,
	nodes,
	isVisible,
}: WorkflowExecutionOverlayProps) {
	const [nodeStatuses, setNodeStatuses] = useState<
		Map<string, NodeExecutionStatus>
	>(new Map());

	// Query for execution details
	const { data: executionDetails } = useQuery({
		queryKey: ["execution-details", executionId],
		queryFn: () =>
			executionId ? executionService.getExecutionDetails(executionId) : null,
		refetchInterval: executionId ? 1000 : false,
		enabled: !!executionId && isVisible,
	});

	// Update node statuses based on execution steps
	useEffect(() => {
		if (!executionDetails?.steps) {
			setNodeStatuses(new Map());
			return;
		}

		const statusMap = new Map<string, NodeExecutionStatus>();

		// Map execution steps to workflow nodes
		executionDetails.steps.forEach((step, index) => {
			// For now, we'll map steps to nodes by index
			// In a real implementation, you'd have proper step-to-node mapping
			if (index < nodes.length) {
				const node = nodes[index];
				statusMap.set(node.id, {
					nodeId: node.id,
					status: step.status,
					startTime: step.started_at,
					endTime: step.completed_at,
					duration: step.execution_time_ms,
					error: step.error_message,
					stepData: step,
				});
			}
		});

		setNodeStatuses(statusMap);
	}, [executionDetails, nodes]);

	if (!(isVisible && executionId) || nodeStatuses.size === 0) {
		return null;
	}

	return (
		<div className="pointer-events-none absolute inset-0 z-10">
			{nodes.map((node) => {
				const status = nodeStatuses.get(node.id);
				if (!status) return null;

				return <NodeStatusOverlay key={node.id} node={node} status={status} />;
			})}

			{/* Execution Progress Indicator */}
			<ExecutionProgressIndicator
				className="pointer-events-auto absolute top-4 left-4"
				execution={executionDetails}
			/>
		</div>
	);
}

interface NodeStatusOverlayProps {
	node: {
		id: string;
		position: { x: number; y: number };
		data: Record<string, any>;
	};
	status: NodeExecutionStatus;
}

function NodeStatusOverlay({ node, status }: NodeStatusOverlayProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "border-gray-300 bg-gray-50";
			case "running":
				return "border-blue-400 bg-blue-50 animate-pulse";
			case "completed":
				return "border-green-400 bg-green-50";
			case "failed":
				return "border-red-400 bg-red-50";
			case "cancelled":
				return "border-gray-400 bg-gray-100";
			case "skipped":
				return "border-yellow-400 bg-yellow-50";
			default:
				return "border-gray-300 bg-gray-50";
		}
	};

	const getStatusIcon = (status: string) => {
		const iconProps = { size: 12, className: "text-current" };
		switch (status) {
			case "pending":
				return <IconClock {...iconProps} />;
			case "running":
				return <IconActivity {...iconProps} />;
			case "completed":
				return <IconCheck {...iconProps} />;
			case "failed":
				return <IconX {...iconProps} />;
			case "cancelled":
				return <IconPlayerStop {...iconProps} />;
			case "skipped":
				return <IconAlertTriangle {...iconProps} />;
			default:
				return <IconClock {...iconProps} />;
		}
	};

	const formatDuration = (ms: number) => {
		if (!ms) return "";
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
		return `${(ms / 60_000).toFixed(1)}m`;
	};

	return (
		<div
			className="pointer-events-auto absolute z-20"
			style={{
				left: node.position.x - 10,
				top: node.position.y - 45,
				transform: "translate(-50%, 0)",
			}}
		>
			{/* Status Badge */}
			<Card
				className={cn(
					"border-2 shadow-lg transition-all duration-200",
					getStatusColor(status.status)
				)}
			>
				<CardContent className="min-w-[120px] p-2">
					<div className="mb-1 flex items-center gap-2">
						{getStatusIcon(status.status)}
						<span className="font-medium text-xs capitalize">
							{status.status}
						</span>
					</div>

					{status.duration && status.duration > 0 && (
						<div className="text-muted-foreground text-xs">
							{formatDuration(status.duration)}
						</div>
					)}

					{status.error && (
						<div
							className="mt-1 max-w-[100px] truncate text-red-600 text-xs"
							title={status.error}
						>
							{status.error}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Connection Line to Node */}
			<div className="mx-auto h-6 w-px bg-border" />
		</div>
	);
}

interface ExecutionProgressIndicatorProps {
	execution: any;
	className?: string;
}

function ExecutionProgressIndicator({
	execution,
	className,
}: ExecutionProgressIndicatorProps) {
	if (!execution) return null;

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-gray-100 text-gray-800 border-gray-200";
			case "running":
				return "bg-blue-100 text-blue-800 border-blue-200";
			case "completed":
				return "bg-green-100 text-green-800 border-green-200";
			case "failed":
				return "bg-red-100 text-red-800 border-red-200";
			case "cancelled":
				return "bg-gray-100 text-gray-800 border-gray-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <IconClock size={14} />;
			case "running":
				return <IconActivity className="animate-pulse" size={14} />;
			case "completed":
				return <IconCheck size={14} />;
			case "failed":
				return <IconX size={14} />;
			case "cancelled":
				return <IconPlayerStop size={14} />;
			default:
				return <IconClock size={14} />;
		}
	};

	const progress = execution.steps
		? Math.round(
				(execution.steps.filter(
					(s: any) =>
						s.status === "completed" ||
						s.status === "failed" ||
						s.status === "skipped"
				).length /
					execution.steps.length) *
					100
			)
		: 0;

	const formatDuration = (ms: number) => {
		if (!ms) return "N/A";
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
		return `${(ms / 60_000).toFixed(1)}m`;
	};

	return (
		<Card className={cn("shadow-lg", className)}>
			<CardContent className="p-3">
				<div className="mb-2 flex items-center gap-2">
					<Badge className={cn("gap-1", getStatusColor(execution.status))}>
						{getStatusIcon(execution.status)}
						{execution.status}
					</Badge>
					<span className="text-muted-foreground text-xs">
						{execution.id?.substring(0, 8)}...
					</span>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs">
						<span>Progress</span>
						<span>{progress}%</span>
					</div>

					<div className="h-2 w-full rounded-full bg-gray-200">
						<div
							className="h-2 rounded-full bg-blue-600 transition-all duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>

					<div className="text-muted-foreground text-xs">
						Duration: {formatDuration(execution.execution_time_ms)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
