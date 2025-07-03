import { createFileRoute, Link } from "@tanstack/react-router";
import { flowService } from "@/services/flow-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GitBranch, Play, Plus, Settings, Edit } from "lucide-react";
import { projectService } from "@/services/project-service";

export const Route = createFileRoute("/(authenticated)/dashboard/_layout/project/$projectId/flows")({
	component: ProjectFlowsPage,
	loader: async ({ context, params }) => {
		const projectId = params.projectId as string;
		
		try {
			const flows = await context.queryClient.fetchQuery({
				queryKey: ["flows", projectId],
				queryFn: () => flowService.getFlows(projectId),
			});
            const project = await context.queryClient.fetchQuery({
                queryKey: ["project", projectId],
                queryFn: () => projectService.getProject(projectId),
            });
			
			return { 
				projectId,
				project,
				flows: flows || [],
				loading: false 
			};
		} catch (error) {
			console.error("Project flows loader error:", error);
			return { 
				projectId,
				flows: [],
				loading: false,
				error: error instanceof Error ? error.message : "Failed to load flows"
			};
		}
	},
});

function ProjectFlowsPage() {
	const { projectId, project, flows, loading, error } = Route.useLoaderData();

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Flows</h2>
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

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Flows</h1>
					<p className="text-muted-foreground">
						Manage workflows for {project.displayName}
					</p>
				</div>
				<Button asChild>
					<Link to="/builder" search={{ projectId }}>
						<Plus className="h-4 w-4 mr-2" />
						Create Flow
					</Link>
				</Button>
			</div>

			{/* Flows Table */}
			<Card>
				<CardHeader>
					<CardTitle>All Flows</CardTitle>
				</CardHeader>
				<CardContent>
					{flows.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Flow</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Schedule</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Updated</TableHead>
									<TableHead className="w-[150px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{flows.map((flow) => (
									<TableRow key={flow.id}>
										<TableCell>
											<div className="flex items-center space-x-3">
												<div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
													<GitBranch className="h-4 w-4 text-primary" />
												</div>
												<div>
													<div className="font-medium">Flow {flow.id.slice(0, 8)}</div>
													<div className="text-sm text-muted-foreground">
														{flow.folderId ? `Folder: ${flow.folderName}` : "Root folder"}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant={flow.status === 'ENABLED' ? 'default' : 'secondary'}>
												{flow.status.toLowerCase()}
											</Badge>
										</TableCell>
										<TableCell>
											{flow.schedule ? (
												<Badge variant="outline">{flow.schedule}</Badge>
											) : (
												<span className="text-muted-foreground">Manual</span>
											)}
										</TableCell>
										<TableCell>
											{new Date(flow.created).toLocaleDateString()}
										</TableCell>
										<TableCell>
											{new Date(flow.updated).toLocaleDateString()}
										</TableCell>
										<TableCell>
											<div className="flex items-center space-x-2">
												<Button variant="ghost" size="sm" asChild title="Edit Flow">
													<Link to="/builder" search={{ projectId, flowId: flow.id }}>
														<Edit className="h-4 w-4" />
													</Link>
												</Button>
												<Button variant="ghost" size="sm" title="Run Flow">
													<Play className="h-4 w-4" />
												</Button>
												<Button variant="ghost" size="sm" title="Flow Settings">
													<Settings className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="text-center py-12">
							<GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-medium mb-2">No flows yet</h3>
							<p className="text-muted-foreground mb-4">
								Create your first workflow to get started with automation
							</p>
							<Button asChild>
								<Link to="/builder" search={{ projectId }}>
									<Plus className="h-4 w-4 mr-2" />
									Create Flow
								</Link>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
} 