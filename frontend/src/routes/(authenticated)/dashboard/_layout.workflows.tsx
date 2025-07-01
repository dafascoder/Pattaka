import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useWorkflow } from '@/hooks/useWorkflow'
import { workflowService } from '@/services/workflow-service'
import { CreateWorkflowRequest, Workflow } from '@/types/api'
import {
  WorkflowHeader,
  WorkflowStats,
  WorkflowTable,
  WorkflowCreateDialog,
  WorkflowError,
  WorkflowLoading
} from '@/components/workflow'
import { toast } from 'sonner'

export const Route = createFileRoute('/(authenticated)/dashboard/_layout/workflows')({
  component: WorkflowsPage,
  loader: async ({ context }) => {
    const { queryClient } = context
    
    // Use the same service and query key as the hook for consistency
    await queryClient.ensureQueryData({
      queryKey: ['workflows'],
      queryFn: () => workflowService.getWorkflows(),
    })

    return {}
  },
  pendingComponent: () => <WorkflowLoading />,
  errorComponent: () => <WorkflowError
        title="Failed to load workflows"
        message="There was an error loading your workflows. Please try again."
        onRetry={() => {
          window.location.reload()
        }}
      />
})

// --------------------------------------------
// Page Component
// --------------------------------------------

function WorkflowsPage() {
  const { getWorkflows, createWorkflow, deleteWorkflow } = useWorkflow()
  const { data: workflows, isLoading, error } = getWorkflows()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleCreateWorkflow = async (workflowData: CreateWorkflowRequest) => {
    return new Promise<Workflow>((resolve, reject) => {
      createWorkflow.mutate(workflowData, {
        onSuccess: (newWorkflow) => resolve(newWorkflow),
        onError: (error) => reject(error),
      })
    })
  }

  const handleDeleteWorkflow = (workflowId: string) => {
    deleteWorkflow.mutate(workflowId, {
      onSuccess: () => {
        toast.success('Workflow deleted successfully', {
          description: 'The workflow has been deleted successfully',
        })
      },
      onError: (error) => {
        toast.error('Failed to delete workflow', {
          description: error.message || 'Failed to delete workflow',
        })
      }
    })
  }
      
  return (
    <div className="space-y-6">
      <WorkflowHeader onCreateClick={() => setCreateDialogOpen(true)} />
      
      <WorkflowStats workflows={workflows} />
      
      <WorkflowTable 
        workflows={workflows} 
        onDelete={handleDeleteWorkflow}
      />

      <WorkflowCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateWorkflow}
        isCreating={createWorkflow.isPending}
      />
    </div>
  )
}
