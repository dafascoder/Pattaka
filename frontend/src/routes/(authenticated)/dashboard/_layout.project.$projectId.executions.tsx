import { createFileRoute, Link } from "@tanstack/react-router";
import { flowService } from "@/services/flow-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, CheckCircle, Clock, Eye, Loader2, XCircle } from "lucide-react";
import { projectService } from "@/services/project-service";

export const Route = createFileRoute("/(authenticated)/dashboard/_layout/project/$projectId/executions")({
	component: ProjectExecutionsPage,
	loader: async ({ context, params }) => {
		const projectId = params.projectId as string;
		
		try {
			const flowRuns = await context.queryClient.fetchQuery({
				queryKey: ["flow-runs", projectId],
				queryFn: () => flowService.getFlowRuns(projectId),
			});
            const project = await context.queryClient.fetchQuery({
                queryKey: ["project", projectId],
                queryFn: () => projectService.getProject(projectId),
            });
			
			return { 
				projectId,
				project,
				flowRuns: flowRuns || [],
				loading: false 
			};
		} catch (error) {
			console.error("Project executions loader error:", error);
			return { 
				projectId,
				flowRuns: [],
				loading: false,
				error: error instanceof Error ? error.message : "Failed to load executions"
			};
		}
	},
});

function ProjectExecutionsPage() {
	const { projectId, project, flowRuns, loading, error } = Route.useLoaderData();

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Executions</h2>
					<p className="text-muted-foreground">{error}</p>
				</div>
			</div>
		);
	}

    if (!project) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-destructive mb-2">Project not found</h2>
                    <p className="text-muted-foreground">The project you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'completed':
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case 'failed':
				return <XCircle className="h-4 w-4 text-red-500" />;
			case 'running':
				return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
			case 'pending':
				return <Clock className="h-4 w-4 text-yellow-500" />;
			default:
				return <Activity className="h-4 w-4 text-muted-foreground" />;
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
			default:
				return 'outline';
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Executions</h1>
					<p className="text-muted-foreground">
						Flow execution history for {project.displayName}
					</p>
				</div>
			</div>

			{/* Executions Table */}
			<Card>
				<CardHeader>
					<CardTitle>Flow Runs</CardTitle>
				</CardHeader>
				<CardContent>
					{flowRuns.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Flow</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Environment</TableHead>
									<TableHead>Start Time</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Version</TableHead>
									<TableHead className="w-[100px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{flowRuns.map((run) => (
									<TableRow key={run.id}>
										<TableCell>
											<div className="flex items-center space-x-3">
												<div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
													{getStatusIcon(run.status)}
												</div>
												<div>
													<div className="font-medium">
														{run.flowDisplayName || `Flow ${run.flowVersionId}`}
													</div>
													<div className="text-sm text-muted-foreground">
														{run.flowVersionName || "Version " + run.flowVersionNumber}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant={getStatusVariant(run.status)}>
												{run.status}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge variant="outline">{run.environment}</Badge>
										</TableCell>
										<TableCell>
											{new Date(run.startTime).toLocaleString()}
										</TableCell>
										<TableCell>
											{run.finishTime ? (
												<span>
													{Math.round(
														(new Date(run.finishTime).getTime() - new Date(run.startTime).getTime()) / 1000
													)}s
												</span>
											) : (
												<span className="text-muted-foreground">Running...</span>
											)}
										</TableCell>
										<TableCell>
											<span className="text-sm text-muted-foreground">
												v{run.flowVersionNumber}
											</span>
										</TableCell>
										<TableCell>
											<Button variant="ghost" size="sm" asChild>
												<Link to="/dashboard/project/$projectId/executions/$runId" params={{ projectId: projectId, runId: run.id }}>
													<Eye className="h-4 w-4" />
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="text-center py-12">
							<Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-medium mb-2">No executions yet</h3>
							<p className="text-muted-foreground mb-4">
								Execute a flow to see runs here
							</p>
							<Button asChild>
								<Link to="/dashboard/project/$projectId/flows" params={{ projectId: projectId }}>
									View Flows
								</Link>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
} 