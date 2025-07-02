import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
	WorkflowCreateDialog,
	WorkflowError,
	WorkflowHeader,
	WorkflowLoading,
	WorkflowStats,
	WorkflowTable,
} from "@/components/workflow";
import { useWorkflow } from "@/hooks/useWorkflow";
import { workflowService } from "@/services/workflow-service";
import type { CreateWorkflowRequest, Workflow } from "@/types/api";

export const Route = createFileRoute(
	"/(authenticated)/dashboard/_layout/workflows"
)({
	component: WorkflowsPage,
	loader: async ({ context }) => {
		const { queryClient } = context;

		// Use the same service and query key as the hook for consistency
		await queryClient.ensureQueryData({
			queryKey: ["workflows"],
			queryFn: () => workflowService.getWorkflows(),
		});

		return {};
	},
	pendingComponent: () => <WorkflowLoading />,
	errorComponent: () => (
		<WorkflowError
			message="There was an error loading your workflows. Please try again."
			onRetry={() => {
				window.location.reload();
			}}
			title="Failed to load workflows"
		/>
	),
});

// --------------------------------------------
// Page Component
// --------------------------------------------

function WorkflowsPage() {
	const { getWorkflows, createWorkflow, deleteWorkflow } = useWorkflow();
	const { data: workflows, isLoading, error } = getWorkflows();
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const handleCreateWorkflow = async (workflowData: CreateWorkflowRequest) => {
		return new Promise<Workflow>((resolve, reject) => {
			createWorkflow.mutate(workflowData, {
				onSuccess: (newWorkflow) => resolve(newWorkflow),
				onError: (error) => reject(error),
			});
		});
	};

	const handleDeleteWorkflow = (workflowId: string) => {
		deleteWorkflow.mutate(workflowId, {
			onSuccess: () => {
				toast.success("Workflow deleted successfully", {
					description: "The workflow has been deleted successfully",
				});
			},
			onError: (error) => {
				toast.error("Failed to delete workflow", {
					description: error.message || "Failed to delete workflow",
				});
			},
		});
	};

	return (
		<div className="space-y-6">
			<WorkflowHeader onCreateClick={() => setCreateDialogOpen(true)} />

			<WorkflowStats workflows={workflows} />

			<WorkflowTable onDelete={handleDeleteWorkflow} workflows={workflows} />

			<WorkflowCreateDialog
				isCreating={createWorkflow.isPending}
				onOpenChange={setCreateDialogOpen}
				onSubmit={handleCreateWorkflow}
				open={createDialogOpen}
			/>
		</div>
	);
}
