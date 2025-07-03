import { createFileRoute, redirect } from "@tanstack/react-router";
import { flowService } from "@/services/flow-service";
import { projectService } from "@/services/project-service";
import { EnhancedFlowBuilder } from "@/components/builder/enhanced-flow-builder";
import type { FlowVersion } from '@/types/api';
import { BuilderLoading } from "@/components/builder/builder-loading";
import { BuilderEmptyState } from "@/components/builder/builder-empty-state";

interface BuilderSearch {
	projectId?: string;
	flowId?: string;
	versionId?: string;
}

export const Route = createFileRoute("/(authenticated)/builder")({
	validateSearch: (search: Record<string, unknown>): BuilderSearch => {
		return {
			projectId: typeof search.projectId === 'string' ? search.projectId : undefined,
			flowId: typeof search.flowId === 'string' ? search.flowId : undefined,
			versionId: typeof search.versionId === 'string' ? search.versionId : undefined,
		};
	},
	beforeLoad: ({ search }) => {
		// If no projectId is provided, redirect to projects page
		if (!search.projectId) {
			throw redirect({
				to: '/dashboard/projects',
			});
		}
	},
	loader: async ({ context, location }) => {
		const searchParams = new URLSearchParams(location.search);
		const projectId = searchParams.get('projectId') || undefined;
		const flowId = searchParams.get('flowId') || undefined;
		const versionId = searchParams.get('versionId') || undefined;
		
		try {
			// Always load the project
			const project = await context.queryClient.fetchQuery({
				queryKey: ["project", projectId],
				queryFn: () => projectService.getProject(projectId!),
			});

			// Load flow if provided
			let flow = null;
			if (flowId) {
				flow = await context.queryClient.fetchQuery({
					queryKey: ["flow", projectId, flowId],
					queryFn: () => flowService.getFlow(projectId!, flowId),
				});
			}

			// Load flow version if provided
			let flowVersion = null;
			let flowVersions: FlowVersion[] = [];
			if (flowId) {
				// Get all versions for the flow
				flowVersions = await context.queryClient.fetchQuery({
					queryKey: ["flowVersions", flowId],
					queryFn: () => flowService.getFlowVersions(flowId),
				});

				// Get specific version or latest
				if (versionId) {
					flowVersion = await context.queryClient.fetchQuery({
						queryKey: ["flowVersion", flowId, versionId],
						queryFn: () => flowService.getFlowVersion(flowId, versionId),
					});
				} else if (flowVersions.length > 0) {
					// Load the latest version
					const latestVersion = flowVersions.reduce((latest, current) => 
						current.version > latest.version ? current : latest
					);
					flowVersion = latestVersion;
				}
			}

			return {
				project,
				flow,
				flowVersion,
				flowVersions,
				isNewFlow: !flowId,
				isNewVersion: Boolean(flowId && !versionId),
			};
		} catch (error) {
			console.error("Builder loader error:", error);
			throw new Error(`Failed to load builder data: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	},
	component: BuilderPage,
	pendingComponent: BuilderLoading,
});

function BuilderPage() {
	const loaderData = Route.useLoaderData();
	
	// Add safety check
	if (!loaderData || !loaderData.project) {
		return (
			<BuilderEmptyState />
		);
	}

	return (
		<EnhancedFlowBuilder
			project={loaderData.project}
			flow={loaderData.flow}
			flowVersion={loaderData.flowVersion}
			flowVersions={loaderData.flowVersions}
			isNewFlow={loaderData.isNewFlow}
			isNewVersion={loaderData.isNewVersion}
		/>
	);
}
