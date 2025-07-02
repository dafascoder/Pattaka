import {
	IconActivity,
	IconCheck,
	IconClock,
	IconEye,
	IconLoader,
	IconRefresh,
	IconX,
} from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute(
	"/(authenticated)/dashboard/_layout/executions"
)({
	component: ExecutionsPage,
});

interface Execution {
	id: string;
	workflow_id: string;
	agent_id: string;
	status: "pending" | "running" | "completed" | "failed" | "cancelled";
	input_data: Record<string, any>;
	output_data: Record<string, any>;
	error_message?: string;
	execution_time_ms: number;
	started_at: string;
	completed_at?: string;
	created_at: string;
}

function ExecutionsPage() {
	const [executions, setExecutions] = useState<Execution[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedExecution, setSelectedExecution] = useState<Execution | null>(
		null
	);
	const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
	const [autoRefresh, setAutoRefresh] = useState(true);

	useEffect(() => {
		fetchExecutions();

		// Auto-refresh every 5 seconds if enabled
		const interval = setInterval(() => {
			if (autoRefresh) {
				fetchExecutions();
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [autoRefresh]);

	const fetchExecutions = async () => {
		try {
			const response = await fetch(
				"http://localhost:8080/api/executions?limit=50",
				{
					headers: {
						"X-User-ID": "demo-user",
					},
				}
			);
			const data = await response.json();
			if (data.success) {
				setExecutions(data.data || []);
			}
		} catch (error) {
			console.error("Failed to fetch executions:", error);
			if (loading) {
				toast.error("Failed to load executions");
			}
		} finally {
			setLoading(false);
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <IconClock className="h-4 w-4 text-gray-500" />;
			case "running":
				return <IconLoader className="h-4 w-4 animate-spin text-blue-500" />;
			case "completed":
				return <IconCheck className="h-4 w-4 text-green-500" />;
			case "failed":
				return <IconX className="h-4 w-4 text-red-500" />;
			case "cancelled":
				return <IconX className="h-4 w-4 text-gray-500" />;
			default:
				return <IconActivity className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-gray-100 text-gray-800";
			case "running":
				return "bg-blue-100 text-blue-800";
			case "completed":
				return "bg-green-100 text-green-800";
			case "failed":
				return "bg-red-100 text-red-800";
			case "cancelled":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatDuration = (ms: number) => {
		if (!ms) return "N/A";
		if (ms < 1000) return `${ms}ms`;
		if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
		return `${(ms / 60_000).toFixed(1)}m`;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	const viewExecutionDetails = (execution: Execution) => {
		setSelectedExecution(execution);
		setDetailsDialogOpen(true);
	};

	const getRunningExecutionsCount = () => {
		return executions.filter(
			(e) => e.status === "running" || e.status === "pending"
		).length;
	};

	const getSuccessRate = () => {
		const completed = executions.filter((e) => e.status === "completed").length;
		const total = executions.filter(
			(e) => e.status !== "pending" && e.status !== "running"
		).length;
		return total > 0 ? Math.round((completed / total) * 100) : 0;
	};

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Executions</h1>
					<p className="text-muted-foreground">
						Monitor your workflow executions and their results
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						className={autoRefresh ? "border-green-200 bg-green-50" : ""}
						onClick={() => setAutoRefresh(!autoRefresh)}
						variant="outline"
					>
						<IconRefresh
							className={`mr-2 h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`}
						/>
						Auto Refresh {autoRefresh ? "On" : "Off"}
					</Button>
					<Button onClick={fetchExecutions}>
						<IconRefresh className="mr-2 h-4 w-4" />
						Refresh
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total Executions
						</CardTitle>
						<IconActivity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{executions.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Running</CardTitle>
						<IconLoader className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{getRunningExecutionsCount()}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Success Rate</CardTitle>
						<IconCheck className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{getSuccessRate()}%</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Avg Duration</CardTitle>
						<IconClock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">
							{executions.length > 0
								? formatDuration(
										executions.reduce(
											(sum, e) => sum + (e.execution_time_ms || 0),
											0
										) / executions.length
									)
								: "N/A"}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Executions Table */}
			{executions.length === 0 ? (
				<Card className="py-12 text-center">
					<CardContent>
						<IconActivity className="mx-auto mb-4 h-12 w-12 text-gray-400" />
						<h3 className="mb-2 font-semibold text-lg">No executions yet</h3>
						<p className="mb-4 text-muted-foreground">
							Workflow executions will appear here once you start running your
							agents
						</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Recent Executions</CardTitle>
						<CardDescription>
							Latest workflow executions with their status and results
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Status</TableHead>
									<TableHead>Workflow ID</TableHead>
									<TableHead>Started</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{executions.map((execution) => (
									<TableRow key={execution.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												{getStatusIcon(execution.status)}
												<Badge className={getStatusColor(execution.status)}>
													{execution.status}
												</Badge>
											</div>
										</TableCell>
										<TableCell className="font-mono text-sm">
											{execution.workflow_id.substring(0, 8)}...
										</TableCell>
										<TableCell>{formatDate(execution.started_at)}</TableCell>
										<TableCell>
											{formatDuration(execution.execution_time_ms)}
										</TableCell>
										<TableCell>
											<Button
												onClick={() => viewExecutionDetails(execution)}
												size="sm"
												variant="outline"
											>
												<IconEye className="mr-1 h-3 w-3" />
												View
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			{/* Execution Details Dialog */}
			<Dialog onOpenChange={setDetailsDialogOpen} open={detailsDialogOpen}>
				<DialogContent className="max-h-[80vh] max-w-4xl">
					<DialogHeader>
						<DialogTitle>Execution Details</DialogTitle>
						<DialogDescription>
							Detailed information about the workflow execution
						</DialogDescription>
					</DialogHeader>
					{selectedExecution && (
						<div className="space-y-6">
							{/* Basic Info */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<h4 className="mb-2 font-semibold">Basic Information</h4>
									<div className="space-y-2 text-sm">
										<div>
											<span className="font-medium">ID:</span>{" "}
											{selectedExecution.id}
										</div>
										<div>
											<span className="font-medium">Status:</span>
											<Badge
												className={`ml-2 ${getStatusColor(selectedExecution.status)}`}
											>
												{selectedExecution.status}
											</Badge>
										</div>
										<div>
											<span className="font-medium">Started:</span>{" "}
											{formatDate(selectedExecution.started_at)}
										</div>
										{selectedExecution.completed_at && (
											<div>
												<span className="font-medium">Completed:</span>{" "}
												{formatDate(selectedExecution.completed_at)}
											</div>
										)}
										<div>
											<span className="font-medium">Duration:</span>{" "}
											{formatDuration(selectedExecution.execution_time_ms)}
										</div>
									</div>
								</div>
								<div>
									<h4 className="mb-2 font-semibold">Workflow Info</h4>
									<div className="space-y-2 text-sm">
										<div>
											<span className="font-medium">Workflow ID:</span>{" "}
											{selectedExecution.workflow_id}
										</div>
										<div>
											<span className="font-medium">Agent ID:</span>{" "}
											{selectedExecution.agent_id}
										</div>
									</div>
								</div>
							</div>

							{/* Input Data */}
							<div>
								<h4 className="mb-2 font-semibold">Input Data</h4>
								<ScrollArea className="h-32 w-full rounded-md border p-4">
									<pre className="text-xs">
										{JSON.stringify(selectedExecution.input_data, null, 2)}
									</pre>
								</ScrollArea>
							</div>

							{/* Output Data */}
							<div>
								<h4 className="mb-2 font-semibold">Output Data</h4>
								<ScrollArea className="h-32 w-full rounded-md border p-4">
									<pre className="text-xs">
										{JSON.stringify(selectedExecution.output_data, null, 2)}
									</pre>
								</ScrollArea>
							</div>

							{/* Error Message */}
							{selectedExecution.error_message && (
								<div>
									<h4 className="mb-2 font-semibold text-red-600">
										Error Message
									</h4>
									<div className="rounded-md border border-red-200 bg-red-50 p-4">
										<p className="text-red-800 text-sm">
											{selectedExecution.error_message}
										</p>
									</div>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
