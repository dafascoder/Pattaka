    import { Workflow, CreateWorkflowRequest } from "@/types/api"
import { fetchWrapper } from "@/utils/fetch-wrapper"

export const workflowService = {
  getWorkflow: async (workflowId: string): Promise<Workflow> => {
    const response = await fetchWrapper(`/api/workflows/${workflowId}`, {
      method: 'GET',
    })

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch workflow')
    }

    const data = response.data as Workflow
    return data
  },
  getWorkflows: async (): Promise<Workflow[]> => {
    const response = await fetchWrapper('/api/workflows', {
      method: 'GET',
    })

    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch workflows')
    }

    const data = response.data as Workflow[]
    return data
  },

  createWorkflow: async (workflow: CreateWorkflowRequest): Promise<Workflow> => {
    const response = await fetchWrapper('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    })

    if (!response.success) {
      throw new Error(response.error || 'Failed to create workflow')
    }

    const data = response.data as Workflow
    return data
  },

  updateWorkflow: async (workflowId: string, workflow: Partial<Workflow>): Promise<Workflow> => {
    const response = await fetchWrapper(`/api/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    })

    if (!response.success) {
      throw new Error(response.error || 'Failed to update workflow')
    }

    const data = response.data as Workflow
    return data
  },

  deleteWorkflow: async (workflowId: string): Promise<void> => {
    const response = await fetchWrapper(`/api/workflows/${workflowId}`, {
      method: 'DELETE',
    })

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete workflow')
    }

    return response.data
  }
}