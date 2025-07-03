import { createFileRoute } from "@tanstack/react-router";
import { agentService } from "@/services/agent-service";
import { projectService } from "@/services/project-service";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export const Route = createFileRoute("/(authenticated)/dashboard/_layout/")({
	component: DashboardPage,
	loader: async ({ context }) => {
		try {
			const [agents, projects] = await Promise.all([
				context.queryClient.fetchQuery({
					queryKey: ["agents"],
					queryFn: () => agentService.getAgents(),
				}),
				context.queryClient.fetchQuery({
					queryKey: ["projects"],
					queryFn: () => projectService.getProjects(),
				}),
			]);
			
			return { 
				agents: agents || [], 
				projects: projects || [],
				loading: false 
			};
		} catch (error) {
			console.error("Dashboard loader error:", error);
			return { 
				agents: [], 
				projects: [],
				loading: false,
				error: error instanceof Error ? error.message : "Failed to load dashboard data"
			};
		}
	},
});

function DashboardPage() {
	const { agents, projects, loading, error } = Route.useLoaderData();

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Dashboard</h2>
					<p className="text-muted-foreground">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			<DashboardOverview
				agents={agents}
				projects={projects}
				loading={loading}
			/>
		</div>
	);
}
