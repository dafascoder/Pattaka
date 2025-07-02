import { createFileRoute } from "@tanstack/react-router";
//import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { agentService } from "@/services/agent-service";

export const Route = createFileRoute("/(authenticated)/dashboard/_layout/")({
	component: DashboardPage,
	loader: async ({ context }) => {
		const agents = await context.queryClient.fetchQuery({
			queryKey: ["agents"],
			queryFn: () => agentService.getAgents(),
		});
		return { agents, agentsLoading: false };
	},
});

function DashboardPage() {
	const { agents, agentsLoading } = Route.useLoaderData();

	return (
		<div>
			<h1>Dashboard</h1>
		</div>
	);
}
