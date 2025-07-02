import {
	IconBug,
	IconCheck,
	IconPlayerPlay,
	IconPlayerStop,
	IconRefresh,
	IconX,
} from "@tabler/icons-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { WorkflowBuilder } from "@/components/builder/workflow-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { executionService } from "@/services/execution-service";
import { DebugView } from "./debug-view";

// Mock workflow nodes for testing
const mockNodes = [
	{
		id: "trigger-1",
		type: "customNode",
		position: { x: 100, y: 100 },
		data: { label: "Webhook Trigger", nodeType: "trigger" },
	},
	{
		id: "action-1",
		type: "customNode",
		position: { x: 300, y: 100 },
		data: { label: "HTTP Request", nodeType: "action" },
	},
	{
		id: "condition-1",
		type: "customNode",
		position: { x: 500, y: 100 },
		data: { label: "Check Response", nodeType: "condition" },
	},
	{
		id: "action-2",
		type: "customNode",
		position: { x: 700, y: 100 },
		data: { label: "Log Result", nodeType: "action" },
	},
];

const mockEdges = [
	{
		id: "edge-1",
		source: "trigger-1",
		target: "action-1",
		sourceHandle: null,
		targetHandle: null,
	},
	{
		id: "edge-2",
		source: "action-1",
		target: "condition-1",
		sourceHandle: null,
		targetHandle: null,
	},
	{
		id: "edge-3",
		source: "condition-1",
		target: "action-2",
		sourceHandle: null,
		targetHandle: null,
	},
];

export function DebugTest() {
	const [isDebugOpen, setIsDebugOpen] = useState(false);
	const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
		null
	);
	const [executionStatus, setExecutionStatus] = useState<
		"idle" | "running" | "completed" | "failed"
	>("idle");
	const [executionId, setExecutionId] = useState<string | null>(null);
	const workflowId = "test-workflow-1";

	// Simulate workflow execution
	const executeWorkflow = async () => {
		try {
			setExecutionStatus("running");

			// Create a mock execution
			const execution = await executionService.executeWorkflow(workflowId, {
				trigger_type: "manual",
				test_data: "Debug test execution",
			});

			setExecutionId(execution.id);
			setSelectedExecutionId(execution.id);

			toast.success("Workflow execution started");

			// Simulate status updates
			setTimeout(() => {
				setExecutionStatus("completed");
				toast.success("Workflow execution completed");
			}, 5000);
		} catch (error) {
			console.error("Failed to execute workflow:", error);
			setExecutionStatus("failed");
			toast.error("Failed to execute workflow");
		}
	};

	// Stop execution
	const stopExecution = async () => {
		if (executionId) {
			try {
				await executionService.cancelExecution(executionId);
				setExecutionStatus("idle");
				toast.info("Workflow execution cancelled");
			} catch (error) {
				console.error("Failed to cancel execution:", error);
				toast.error("Failed to cancel execution");
			}
		}
	};

	// Reset test
	const resetTest = () => {
		setExecutionStatus("idle");
		setExecutionId(null);
		setSelectedExecutionId(null);
		setIsDebugOpen(false);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "idle":
				return "bg-gray-100 text-gray-800";
			case "running":
				return "bg-blue-100 text-blue-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "failed":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "running":
				return <IconPlayerPlay className="animate-pulse" size={14} />;
			case "completed":
				return <IconCheck size={14} />;
			case "failed":
				return <IconX size={14} />;
			default:
				return null;
		}
	};

	return (
		<div className="flex h-screen flex-col">
			{/* Test Controls */}
			<Card className="m-4 mb-0">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-lg">
						<IconBug size={20} />
						Debug View Test
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Badge className={`gap-2 ${getStatusColor(executionStatus)}`}>
								{getStatusIcon(executionStatus)}
								{executionStatus}
							</Badge>
							{executionId && (
								<span className="text-muted-foreground text-sm">
									Execution: {executionId.substring(0, 8)}...
								</span>
							)}
						</div>

						<div className="flex items-center gap-2">
							<Button
								className="gap-2"
								disabled={executionStatus === "running"}
								onClick={executeWorkflow}
							>
								<IconPlayerPlay size={16} />
								Execute Workflow
							</Button>

							{executionStatus === "running" && (
								<Button
									className="gap-2"
									onClick={stopExecution}
									variant="outline"
								>
									<IconPlayerStop size={16} />
									Stop
								</Button>
							)}

							<Button
								className="gap-2"
								onClick={() => setIsDebugOpen(true)}
								variant="outline"
							>
								<IconBug size={16} />
								Open Debug
							</Button>

							<Button className="gap-2" onClick={resetTest} variant="ghost">
								<IconRefresh size={16} />
								Reset
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Workflow Builder */}
			<div className="m-4 mt-2 flex-1 overflow-hidden rounded-lg border">
				<WorkflowBuilder
					edges={mockEdges}
					executionId={selectedExecutionId}
					nodes={mockNodes}
					showExecutionOverlay={
						executionStatus === "running" && !!selectedExecutionId
					}
					workflowId={workflowId}
				/>
			</div>

			{/* Debug View */}
			<DebugView
				isOpen={isDebugOpen}
				onExecutionSelect={setSelectedExecutionId}
				onOpenChange={setIsDebugOpen}
				workflowId={workflowId}
			/>

			{/* Instructions */}
			<Card className="m-4 mt-0">
				<CardContent className="p-4">
					<div className="space-y-2 text-muted-foreground text-sm">
						<div>
							<strong>How to test:</strong>
						</div>
						<ol className="ml-2 list-inside list-decimal space-y-1">
							<li>Click "Execute Workflow" to start a test execution</li>
							<li>Click "Open Debug" to view the debug panel</li>
							<li>
								Watch real-time execution progress in both the debug panel and
								workflow overlay
							</li>
							<li>Expand individual steps to see detailed execution data</li>
							<li>Use "Reset" to clear everything and start over</li>
						</ol>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
