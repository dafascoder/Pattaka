import { createFileRoute, Link } from "@tanstack/react-router";
import { flowService } from "@/services/flow-service";
import { projectService } from "@/services/project-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
	Activity, 
	ArrowLeft, 
	CheckCircle, 
	Clock, 
	Loader2, 
	XCircle, 
	Play,
	Pause,
	Square,
	RefreshCw,
	Code,
	FileText,
	AlertCircle,
	Calendar,
	Timer,
	Tag,
	Settings
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/(authenticated)/dashboard/_layout/project/$projectId/executions/$runId")({
	component: ExecutionDetailPage,
	loader: async ({ context, params }) => {
		const { projectId, runId } = params;
		
		try {
			const [flowRun, project] = await Promise.all([
				context.queryClient.fetchQuery({
					queryKey: ["flow-run", runId],
					queryFn: () => flowService.getFlowRun(runId),
				}),
				context.queryClient.fetchQuery({
					queryKey: ["project", projectId],
					queryFn: () => projectService.getProject(projectId),
				})
			]);
			
			return { 
				projectId,
				runId,
				flowRun,
				project,
				loading: false 
			};
		} catch (error) {
			console.error("Execution detail loader error:", error);
			return { 
				projectId,
				runId,
				flowRun: null,
				project: null,
				loading: false,
				error: error instanceof Error ? error.message : "Failed to load execution details"
			};
		}
	},
});

function ExecutionDetailPage() {
	const { projectId, runId, flowRun, project, loading, error } = Route.useLoaderData();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [currentRun, setCurrentRun] = useState(flowRun);

	// Auto-refresh for running executions
	useEffect(() => {
		if (!currentRun || currentRun.status !== 'running') return;

		const interval = setInterval(async () => {
			try {
				const updatedRun = await flowService.getFlowRun(runId);
				setCurrentRun(updatedRun);
			} catch (error) {
				console.error("Failed to refresh execution:", error);
			}
		}, 2000); // Refresh every 2 seconds

		return () => clearInterval(interval);
	}, [runId, currentRun?.status]);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			const updatedRun = await flowService.getFlowRun(runId);
			setCurrentRun(updatedRun);
		} catch (error) {
			console.error("Failed to refresh execution:", error);
		} finally {
			setIsRefreshing(false);
		}
	};

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Execution</h2>
					<p className="text-muted-foreground mb-4">{error}</p>
					<Button asChild>
						<Link to="/dashboard/project/$projectId/executions" params={{ projectId }}>
							Back to Executions
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	if (!currentRun || !project) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">Loading execution details...</p>
				</div>
			</div>
		);
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="h-5 w-5 text-green-500" />;
			case 'failed':
				return <XCircle className="h-5 w-5 text-red-500" />;
			case 'running':
				return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
			case 'pending':
				return <Clock className="h-5 w-5 text-yellow-500" />;
			case 'paused':
				return <Pause className="h-5 w-5 text-orange-500" />;
			case 'cancelled':
				return <Square className="h-5 w-5 text-gray-500" />;
			default:
				return <Activity className="h-5 w-5 text-muted-foreground" />;
		}
	};

	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'completed':
				return 'default';
			case 'failed':
				return 'destructive';
			case 'running':
				return 'secondary';
			case 'pending':
				return 'outline';
			case 'paused':
				return 'secondary';
			case 'cancelled':
				return 'outline';
			default:
				return 'outline';
		}
	};

	const formatDuration = (startTime: string, finishTime?: string) => {
		const start = new Date(startTime);
		const end = finishTime ? new Date(finishTime) : new Date();
		const duration = Math.round((end.getTime() - start.getTime()) / 1000);
		
		if (duration < 60) return `${duration}s`;
		if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
		return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
	};

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleString();
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Button variant="ghost" size="sm" asChild>
						<Link to="/dashboard/project/$projectId/executions" params={{ projectId }}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Executions
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-bold flex items-center space-x-3">
							{getStatusIcon(currentRun.status)}
							<span>Execution Details</span>
						</h1>
						<p className="text-muted-foreground">
							{currentRun.flowDisplayName || `Flow ${currentRun.flowVersionId}`}
						</p>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleRefresh}
						disabled={isRefreshing}
					>
						<RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
						Refresh
					</Button>
				</div>
			</div>

			{/* Status Overview */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2 mb-2">
							<Activity className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Status</span>
						</div>
						<Badge variant={getStatusVariant(currentRun.status)} className="text-sm">
							{currentRun.status.toUpperCase()}
						</Badge>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2 mb-2">
							<Timer className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Duration</span>
						</div>
						<p className="text-lg font-semibold">
							{formatDuration(currentRun.startTime, currentRun.finishTime)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2 mb-2">
							<Tag className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Environment</span>
						</div>
						<Badge variant="outline">{currentRun.environment}</Badge>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4">
						<div className="flex items-center space-x-2 mb-2">
							<Settings className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Version</span>
						</div>
						<p className="text-sm text-muted-foreground">
							v{currentRun.flowVersionNumber || 'N/A'}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="timeline">Timeline</TabsTrigger>
					<TabsTrigger value="logs">Logs</TabsTrigger>
					<TabsTrigger value="metadata">Metadata</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Execution Info */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<FileText className="h-5 w-5" />
									<span>Execution Information</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="text-muted-foreground">Run ID:</span>
										<p className="font-mono text-xs break-all">{currentRun.id}</p>
									</div>
									<div>
										<span className="text-muted-foreground">Flow Version ID:</span>
										<p className="font-mono text-xs break-all">{currentRun.flowVersionId}</p>
									</div>
									<div>
										<span className="text-muted-foreground">Start Time:</span>
										<p>{formatTimestamp(currentRun.startTime)}</p>
									</div>
									<div>
										<span className="text-muted-foreground">Finish Time:</span>
										<p>{currentRun.finishTime ? formatTimestamp(currentRun.finishTime) : 'Running...'}</p>
									</div>
								</div>
								
								{currentRun.tags && currentRun.tags.length > 0 && (
									<div>
										<span className="text-muted-foreground text-sm">Tags:</span>
										<div className="flex flex-wrap gap-1 mt-1">
											{currentRun.tags.map((tag, index) => (
												<Badge key={index} variant="outline" className="text-xs">
													{tag}
												</Badge>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Flow Details */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Code className="h-5 w-5" />
									<span>Flow Details</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3 text-sm">
									<div>
										<span className="text-muted-foreground">Flow Name:</span>
										<p className="font-medium">
											{currentRun.flowDisplayName || 'Untitled Flow'}
										</p>
									</div>
									<div>
										<span className="text-muted-foreground">Version Name:</span>
										<p>{currentRun.flowVersionName || 'Draft'}</p>
									</div>
									<div>
										<span className="text-muted-foreground">Project:</span>
										<p>{project.displayName}</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Timeline Tab */}
				<TabsContent value="timeline" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Calendar className="h-5 w-5" />
								<span>Execution Timeline</span>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center space-x-4 p-4 border rounded-lg">
									<div className="flex-shrink-0">
										<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
											<Play className="h-4 w-4 text-blue-600" />
										</div>
									</div>
									<div className="flex-1">
										<p className="font-medium">Execution Started</p>
										<p className="text-sm text-muted-foreground">
											{formatTimestamp(currentRun.startTime)}
										</p>
									</div>
								</div>

								{currentRun.status === 'running' && (
									<div className="flex items-center space-x-4 p-4 border rounded-lg bg-blue-50">
										<div className="flex-shrink-0">
											<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
												<Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
											</div>
										</div>
										<div className="flex-1">
											<p className="font-medium">Currently Running</p>
											<p className="text-sm text-muted-foreground">
												Duration: {formatDuration(currentRun.startTime)}
											</p>
										</div>
									</div>
								)}

								{currentRun.finishTime && (
									<div className="flex items-center space-x-4 p-4 border rounded-lg">
										<div className="flex-shrink-0">
											<div className={`w-8 h-8 rounded-full flex items-center justify-center ${
												currentRun.status === 'completed' 
													? 'bg-green-100' 
													: currentRun.status === 'failed' 
													? 'bg-red-100' 
													: 'bg-gray-100'
											}`}>
												{getStatusIcon(currentRun.status)}
											</div>
										</div>
										<div className="flex-1">
											<p className="font-medium">
												Execution {currentRun.status === 'completed' ? 'Completed' : 'Finished'}
											</p>
											<p className="text-sm text-muted-foreground">
												{formatTimestamp(currentRun.finishTime)}
											</p>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Logs Tab */}
				<TabsContent value="logs" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Execution Logs</CardTitle>
						</CardHeader>
						<CardContent>
							<ScrollArea className="h-[400px] w-full border rounded-md p-4">
								<div className="space-y-2 font-mono text-sm">
									<div className="text-muted-foreground">
										[{formatTimestamp(currentRun.startTime)}] Execution started
									</div>
									<div className="text-muted-foreground">
										[{formatTimestamp(currentRun.startTime)}] Environment: {currentRun.environment}
									</div>
									<div className="text-muted-foreground">
										[{formatTimestamp(currentRun.startTime)}] Flow Version: v{currentRun.flowVersionNumber}
									</div>
									
									{currentRun.status === 'running' && (
										<div className="text-blue-600">
											[{formatTimestamp(new Date().toISOString())}] Execution in progress...
										</div>
									)}
									
									{currentRun.finishTime && (
										<div className={`${
											currentRun.status === 'completed' 
												? 'text-green-600' 
												: currentRun.status === 'failed' 
												? 'text-red-600' 
												: 'text-muted-foreground'
										}`}>
											[{formatTimestamp(currentRun.finishTime)}] Execution {currentRun.status}
										</div>
									)}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Metadata Tab */}
				<TabsContent value="metadata" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Execution Metadata</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{currentRun.pauseMetadata && Object.keys(currentRun.pauseMetadata).length > 0 && (
									<div>
										<h4 className="font-medium mb-2">Pause Metadata</h4>
										<pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
											{JSON.stringify(currentRun.pauseMetadata, null, 2)}
										</pre>
									</div>
								)}
								
								<div>
									<h4 className="font-medium mb-2">Raw Execution Data</h4>
									<pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
										{JSON.stringify(currentRun, null, 2)}
									</pre>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
} 