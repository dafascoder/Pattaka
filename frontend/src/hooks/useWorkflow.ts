import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { workflowService } from "@/services/workflow-service"
import { CreateWorkflowRequest, Workflow } from "@/types/api"

export const useWorkflow = () => {
  const queryClient = useQueryClient()

  const getWorkflow = (workflowId: string) => {
    return useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => workflowService.getWorkflow(workflowId),
  })
}

const getWorkflows = () => {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowService.getWorkflows(),
  })
}

  const createWorkflow = useMutation({
    mutationFn: (workflow: CreateWorkflowRequest) => workflowService.createWorkflow(workflow),
    onSuccess: (newWorkflow: Workflow) => {
      // queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.setQueryData(['workflows'], (oldData: Workflow[] | undefined) => {
        if (!oldData) return [newWorkflow]
        return [...oldData, newWorkflow]
      })
    },
  })

  // don't invalidate the query cache when deleting a workflow, we want to keep the data in the cache
  // just remove the workflow from the cache
  const deleteWorkflow = useMutation({
    mutationFn: (workflowId: string) => workflowService.deleteWorkflow(workflowId),
    onSuccess: (_, workflowId: string) => {
      queryClient.setQueryData(['workflows'], (oldData: Workflow[]) => {
        return oldData.filter((workflow) => workflow.id !== workflowId)
      })
    },
  })



  //  

  return {
    getWorkflow,
    getWorkflows,
    createWorkflow,
    deleteWorkflow,
  }
}
