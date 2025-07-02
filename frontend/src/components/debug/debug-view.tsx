import {
	IconActivity,
	IconAlertTriangle,
	IconBug,
	IconCheck,
	IconChevronDown,
	IconChevronRight,
	IconClock,
	IconCode,
	IconEye,
	IconPlayerPause,
	IconPlayerPlay,
	IconPlayerStop,
	IconRefresh,
	IconTerminal,
	IconX,
} from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { executionService } from "@/services/execution-service";
import type { Execution, ExecutionStep } from "@/types/api";

interface DebugViewProps {
	workflowId: string;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onExecutionSelect?: (executionId: string | null) => void;
}

interface ExecutionWithSteps extends Execution {
	steps?: ExecutionStep[];
}

export function DebugView({
	workflowId,
	isOpen,
	onOpenChange,
	onExecutionSelect,
}: DebugViewProps) {
	const [selectedExecution, setSelectedExecution] = useState<string | null>(
		null
	);
	const [autoRefresh, setAutoRefresh] = useState(true);
	const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
	const queryClient = useQueryClient();
	const intervalRef = useRef<NodeJS.Timeout>();

	// Query for recent executions
	const { data: executions = [], isLoading } = useQuery({
		queryKey: ["workflow-executions", workflowId],
		queryFn: () => executionService.getExecutionsByWorkflow(workflowId, 10),
		refetchInterval: autoRefresh ? 2000 : false,
		enabled: isOpen,
	});

	// Query for detailed execution data when one is selected
	const { data: executionDetails, isLoading: isLoadingDetails } = useQuery({
		queryKey: ["execution-details", selectedExecution],
		queryFn: () =>
			selectedExecution
				? executionService.getExecutionDetails(selectedExecution)
				: null,
		refetchInterval: autoRefresh && selectedExecution ? 1000 : false,
		enabled: !!selectedExecution && isOpen,
	});

	// Auto-select most recent running execution
	useEffect(() => {
		if (executions.length > 0 && !selectedExecution) {
			const runningExecution = executions.find(
				(e) => e.status === "running" || e.status === "pending"
			);
			if (runningExecution) {
				setSelectedExecution(runningExecution.id);
				onExecutionSelect?.(runningExecution.id);
			}
		}
	}, [executions, selectedExecution, onExecutionSelect]);

	// Handle execution selection
	const handleExecutionSelect = (executionId: string) => {
		setSelectedExecution(executionId);
		onExecutionSelect?.(executionId);
	};

	// Toggle step expansion
	const toggleStepExpansion = (stepId: string) => {
		const newExpanded = new Set(expandedSteps);
		if (newExpanded.has(stepId)) {
			newExpanded.delete(stepId);
		} else {
			newExpanded.add(stepId);
		}
		setExpandedSteps(newExpanded);
	};

	// Get status color
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
			case "skipped":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	// Get status icon
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
			case "skipped":
				return <IconAlertTriangle size={14} />;
			default:
				return <IconClock size={14} />;
		}
	};

	// Calculate execution progress
	const getExecutionProgress = (execution: ExecutionWithSteps) => {
		if (!execution.steps || execution.steps.length === 0) return 0;
		const completedSteps = execution.steps.filter(
			(s) =>
				s.status === "completed" ||
				s.status === "failed" ||
				s.status === "skipped"
		).length;
		return Math.round((completedSteps / execution.steps.length) * 100);
	};

	// Format duration
	const formatDuration = (ms: number) => {
		if (!ms) return "N/A";
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
		return `${(ms / 60_000).toFixed(1)}m`;
	};

	// Format timestamp
	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleTimeString();
	};

	return (
		<Sheet onOpenChange={onOpenChange} open={isOpen}>
			<SheetTrigger asChild>
				<Button className="gap-2" size="sm" variant="outline">
					<IconBug size={16} />
					Debug
				</Button>
			</SheetTrigger>
			<SheetContent className="w-[800px] max-w-[90vw] p-0" side="right">
				<SheetHeader className="p-6 pb-4">
					<div className="flex items-center justify-between">
						<SheetTitle className="flex items-center gap-2">
							<IconBug size={20} />
							Workflow Debug
						</SheetTitle>
						<div className="flex items-center gap-2">
							<Button
								className={cn(
									"gap-2",
									autoRefresh && "border-green-200 bg-green-50 text-green-700"
								)}
								onClick={() => setAutoRefresh(!autoRefresh)}
								size="sm"
								variant="outline"
							>
								<IconRefresh
									className={autoRefresh ? "animate-spin" : ""}
									size={14}
								/>
								{autoRefresh ? "Auto" : "Manual"}
							</Button>
						</div>
					</div>
				</SheetHeader>

				<div className="flex-1 overflow-hidden">
					<Tabs className="flex h-full flex-col" defaultValue="executions">
						<TabsList className="mx-6 grid w-full grid-cols-2">
							<TabsTrigger value="executions">Executions</TabsTrigger>
							<TabsTrigger disabled={!selectedExecution} value="debug">
								Debug Details
							</TabsTrigger>
						</TabsList>

						<TabsContent
							className="flex-1 overflow-hidden p-6 pt-4"
							value="executions"
						>
							<Card className="h-full">
								<CardHeader className="pb-3">
									<CardTitle className="text-base">Recent Executions</CardTitle>
								</CardHeader>
								<CardContent className="p-0">
									<ScrollArea className="h-[calc(100vh-280px)]">
										<div className="space-y-2 p-4">
											{isLoading ? (
												<div className="flex items-center justify-center py-8">
													<div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
												</div>
											) : executions.length === 0 ? (
												<div className="py-8 text-center text-muted-foreground">
													No executions found
												</div>
											) : (
												executions.map((execution) => (
													<Card
														className={cn(
															"cursor-pointer transition-colors hover:bg-muted/50",
															selectedExecution === execution.id &&
																"ring-2 ring-primary"
														)}
														key={execution.id}
														onClick={() => handleExecutionSelect(execution.id)}
													>
														<CardContent className="p-4">
															<div className="mb-2 flex items-center justify-between">
																<Badge
																	className={cn(
																		"gap-1",
																		getStatusColor(execution.status)
																	)}
																>
																	{getStatusIcon(execution.status)}
																	{execution.status}
																</Badge>
																<span className="text-muted-foreground text-xs">
																	{formatTimestamp(execution.started_at)}
																</span>
															</div>
															<div className="mb-2 font-mono text-muted-foreground text-sm">
																ID: {execution.id.substring(0, 8)}...
															</div>
															<div className="text-sm">
																Duration:{" "}
																{formatDuration(execution.execution_time_ms)}
															</div>
															{execution.error_message && (
																<div className="mt-2 truncate text-red-600 text-xs">
																	Error: {execution.error_message}
																</div>
															)}
														</CardContent>
													</Card>
												))
											)}
										</div>
									</ScrollArea>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent
							className="flex-1 overflow-hidden p-6 pt-4"
							value="debug"
						>
							{selectedExecution && (
								<ExecutionDebugger
									execution={executionDetails}
									expandedSteps={expandedSteps}
									formatDuration={formatDuration}
									formatTimestamp={formatTimestamp}
									getStatusColor={getStatusColor}
									getStatusIcon={getStatusIcon}
									isLoading={isLoadingDetails}
									onToggleStep={toggleStepExpansion}
								/>
							)}
						</TabsContent>
					</Tabs>
				</div>
			</SheetContent>
		</Sheet>
	);
}

interface ExecutionDebuggerProps {
	execution: ExecutionWithSteps | null | undefined;
	isLoading: boolean;
	expandedSteps: Set<string>;
	onToggleStep: (stepId: string) => void;
	formatDuration: (ms: number) => string;
	formatTimestamp: (timestamp: string) => string;
	getStatusColor: (status: string) => string;
	getStatusIcon: (status: string) => React.ReactNode;
}

function ExecutionDebugger({
	execution,
	isLoading,
	expandedSteps,
	onToggleStep,
	formatDuration,
	formatTimestamp,
	getStatusColor,
	getStatusIcon,
}: ExecutionDebuggerProps) {
	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
			</div>
		);
	}

	if (!execution) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				Select an execution to view debug details
			</div>
		);
	}

	const progress = execution.steps
		? Math.round(
				(execution.steps.filter(
					(s) =>
						s.status === "completed" ||
						s.status === "failed" ||
						s.status === "skipped"
				).length /
					execution.steps.length) *
					100
			)
		: 0;

	return (
		<div className="h-full space-y-4">
			{/* Execution Overview */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<IconActivity size={16} />
						Execution Overview
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center justify-between">
						<Badge className={cn("gap-1", getStatusColor(execution.status))}>
							{getStatusIcon(execution.status)}
							{execution.status}
						</Badge>
						<span className="text-muted-foreground text-sm">
							{formatTimestamp(execution.started_at)}
						</span>
					</div>

					{execution.steps && execution.steps.length > 0 && (
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Progress</span>
								<span>{progress}%</span>
							</div>
							<Progress className="h-2" value={progress} />
						</div>
					)}

					<div className="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">Duration:</span>
							<div className="font-mono">
								{formatDuration(execution.execution_time_ms)}
							</div>
						</div>
						<div>
							<span className="text-muted-foreground">Steps:</span>
							<div className="font-mono">{execution.steps?.length || 0}</div>
						</div>
					</div>

					{execution.error_message && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-3">
							<div className="text-red-800 text-sm">
								<strong>Error:</strong> {execution.error_message}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Execution Steps */}
			{execution.steps && execution.steps.length > 0 && (
				<Card className="flex-1">
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<IconTerminal size={16} />
							Execution Steps
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<ScrollArea className="h-[calc(100vh-500px)]">
							<div className="space-y-2 p-4">
								{execution.steps.map((step, index) => (
									<StepDebugCard
										formatDuration={formatDuration}
										formatTimestamp={formatTimestamp}
										getStatusColor={getStatusColor}
										getStatusIcon={getStatusIcon}
										index={index}
										isExpanded={expandedSteps.has(step.id)}
										key={step.id}
										onToggle={() => onToggleStep(step.id)}
										step={step}
									/>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

interface StepDebugCardProps {
	step: ExecutionStep;
	index: number;
	isExpanded: boolean;
	onToggle: () => void;
	formatDuration: (ms: number) => string;
	formatTimestamp: (timestamp: string) => string;
	getStatusColor: (status: string) => string;
	getStatusIcon: (status: string) => React.ReactNode;
}

function StepDebugCard({
	step,
	index,
	isExpanded,
	onToggle,
	formatDuration,
	formatTimestamp,
	getStatusColor,
	getStatusIcon,
}: StepDebugCardProps) {
	return (
		<Card className="overflow-hidden">
			<CardContent className="p-0">
				<Button
					className="h-auto w-full justify-start p-4"
					onClick={onToggle}
					variant="ghost"
				>
					<div className="flex w-full items-center gap-3">
						<div className="flex items-center gap-2">
							{isExpanded ? (
								<IconChevronDown size={16} />
							) : (
								<IconChevronRight size={16} />
							)}
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-medium text-xs">
								{index + 1}
							</div>
						</div>

						<div className="flex-1 text-left">
							<div className="flex items-center justify-between">
								<div className="font-medium">{step.step_name}</div>
								<Badge className={cn("gap-1", getStatusColor(step.status))}>
									{getStatusIcon(step.status)}
									{step.status}
								</Badge>
							</div>
							<div className="mt-1 text-muted-foreground text-sm">
								{step.step_type} • {formatDuration(step.execution_time_ms)}
							</div>
						</div>
					</div>
				</Button>

				{isExpanded && (
					<div className="border-t bg-muted/30">
						<div className="space-y-4 p-4">
							{/* Step Timeline */}
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-muted-foreground">Started:</span>
									<div className="font-mono">
										{formatTimestamp(step.started_at)}
									</div>
								</div>
								{step.completed_at && (
									<div>
										<span className="text-muted-foreground">Completed:</span>
										<div className="font-mono">
											{formatTimestamp(step.completed_at)}
										</div>
									</div>
								)}
							</div>

							{/* Input Data */}
							{step.input_data && Object.keys(step.input_data).length > 0 && (
								<div>
									<div className="mb-2 flex items-center gap-2 font-medium text-sm">
										<IconCode size={14} />
										Input Data
									</div>
									<pre className="overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs">
										{JSON.stringify(step.input_data, null, 2)}
									</pre>
								</div>
							)}

							{/* Output Data */}
							{step.output_data && Object.keys(step.output_data).length > 0 && (
								<div>
									<div className="mb-2 flex items-center gap-2 font-medium text-sm">
										<IconCode size={14} />
										Output Data
									</div>
									<pre className="overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs">
										{JSON.stringify(step.output_data, null, 2)}
									</pre>
								</div>
							)}

							{/* Error Message */}
							{step.error_message && (
								<div>
									<div className="mb-2 flex items-center gap-2 font-medium text-red-600 text-sm">
										<IconX size={14} />
										Error
									</div>
									<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-600 text-sm">
										{step.error_message}
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
