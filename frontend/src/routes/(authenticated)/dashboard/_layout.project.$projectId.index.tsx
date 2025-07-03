import { createFileRoute } from "@tanstack/react-router";
import { flowService } from "@/services/flow-service";
import { ProjectOverview } from "@/components/project/project-overview";
import { projectService } from "@/services/project-service";

export const Route = createFileRoute("/(authenticated)/dashboard/_layout/project/$projectId/")({
	component: ProjectDashboardPage,
	loader: async ({ context, params }) => {
		const projectId = params.projectId as string;
		
		try {
            const project = await context.queryClient.fetchQuery({
                queryKey: ["project", projectId],
                queryFn: () => projectService.getProject(projectId),
            });
			const [flows, flowRuns] = await Promise.all([
				context.queryClient.fetchQuery({
					queryKey: ["flows", projectId],
					queryFn: () => flowService.getFlows(projectId),
				}),
				context.queryClient.fetchQuery({
					queryKey: ["flow-runs", projectId],
					queryFn: () => flowService.getFlowRuns(projectId),
				}),
			]);
			
			return { 
                project,
				projectId,
				flows: flows || [],
				flowRuns: flowRuns || [],
				loading: false 
			};
		} catch (error) {
			console.error("Project dashboard loader error:", error);
			return { 
				projectId,
				flows: [],
				flowRuns: [],
				loading: false,
				error: error instanceof Error ? error.message : "Failed to load project data"
			};
		}
	},
});

function ProjectDashboardPage() {
	const { projectId, project, flows, flowRuns, loading, error } = Route.useLoaderData();

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Project</h2>
					<p className="text-muted-foreground">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<ProjectOverview
			project={project}
			flows={flows}
			flowRuns={flowRuns}
			loading={loading}
		/>
	);
} 