import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import apiClient from './api-client';
import {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  Workflow,
  CreateWorkflowRequest,
  Integration,
  CreateIntegrationRequest,
  Execution,
  DashboardData,
  AuthContext,
  APIError,
} from '../types/api';

// Query Keys
export const queryKeys = {
  health: ['health'] as const,
  auth: ['auth'] as const,
  dashboard: ['dashboard'] as const,
  agents: ['agents'] as const,
  agent: (id: string) => ['agents', id] as const,
  workflows: ['workflows'] as const,
  workflow: (id: string) => ['workflows', id] as const,
  integrations: ['integrations'] as const,
  integration: (id: string) => ['integrations', id] as const,
  executions: ['executions'] as const,
  execution: (id: string) => ['executions', id] as const,
  executionsByWorkflow: (workflowId: string) => ['executions', 'workflow', workflowId] as const,
  executionsByAgent: (agentId: string) => ['executions', 'agent', agentId] as const,
};

// Helper function to handle API errors
const handleError = (error: APIError, customMessage?: string) => {
  const message = customMessage || error.message || 'An error occurred';
  toast.error(message);
  console.error('API Error:', error);
};

// Health Check Hook
export const useHealthCheck = (options?: UseQueryOptions<{ status: string; timestamp: string }, APIError>) => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.healthCheck(),
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

// Auth Hooks
export const useCurrentUser = (options?: UseQueryOptions<AuthContext, APIError>) => {
  return useQuery({
    queryKey: queryKeys.auth,
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.status === 401 || error.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
};

// Dashboard Hooks
export const useDashboardData = (options?: UseQueryOptions<DashboardData, APIError>) => {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiClient.getDashboardData(),
    staleTime: 60000, // 1 minute
    ...options,
  });
};

// Agent Hooks
export const useAgents = (options?: UseQueryOptions<Agent[], APIError>) => {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => apiClient.getAgents(),
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

export const useAgent = (id: string, options?: UseQueryOptions<Agent, APIError>) => {
  return useQuery({
    queryKey: queryKeys.agent(id),
    queryFn: () => apiClient.getAgent(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
    ...options,
  });
};

export const useCreateAgent = (options?: UseMutationOptions<Agent, APIError, CreateAgentRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (agent: CreateAgentRequest) => apiClient.createAgent(agent),
    onSuccess: (data) => {
      // Invalidate and refetch agents list
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      // Update dashboard data
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success('Agent created successfully');
    },
    onError: (error) => handleError(error, 'Failed to create agent'),
    ...options,
  });
};

export const useUpdateAgent = (options?: UseMutationOptions<Agent, APIError, { id: string; agent: UpdateAgentRequest }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, agent }) => apiClient.updateAgent(id, agent),
    onSuccess: (data, { id }) => {
      // Update the specific agent in cache
      queryClient.setQueryData(queryKeys.agent(id), data);
      // Invalidate agents list to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      toast.success('Agent updated successfully');
    },
    onError: (error) => handleError(error, 'Failed to update agent'),
    ...options,
  });
};

export const useDeleteAgent = (options?: UseMutationOptions<void, APIError, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAgent(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.agent(id) });
      // Invalidate agents list
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      // Update dashboard data
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success('Agent deleted successfully');
    },
    onError: (error) => handleError(error, 'Failed to delete agent'),
    ...options,
  });
};

// Workflow Hooks
export const useWorkflows = (options?: UseQueryOptions<Workflow[], APIError>) => {
  return useQuery({
    queryKey: queryKeys.workflows,
    queryFn: () => apiClient.getWorkflows(),
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

export const useWorkflow = (id: string, options?: UseQueryOptions<Workflow, APIError>) => {
  return useQuery({
    queryKey: queryKeys.workflow(id),
    queryFn: () => apiClient.getWorkflow(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
    ...options,
  });
};

export const useCreateWorkflow = (options?: UseMutationOptions<Workflow, APIError, CreateWorkflowRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (workflow: CreateWorkflowRequest) => apiClient.createWorkflow(workflow),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success('Workflow created successfully');
    },
    onError: (error) => handleError(error, 'Failed to create workflow'),
    ...options,
  });
};

export const useUpdateWorkflow = (options?: UseMutationOptions<Workflow, APIError, { id: string; workflow: Partial<CreateWorkflowRequest> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, workflow }) => apiClient.updateWorkflow(id, workflow),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(queryKeys.workflow(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows });
      toast.success('Workflow updated successfully');
    },
    onError: (error) => handleError(error, 'Failed to update workflow'),
    ...options,
  });
};

export const useDeleteWorkflow = (options?: UseMutationOptions<void, APIError, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteWorkflow(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.workflow(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success('Workflow deleted successfully');
    },
    onError: (error) => handleError(error, 'Failed to delete workflow'),
    ...options,
  });
};

// Integration Hooks
export const useIntegrations = (options?: UseQueryOptions<Integration[], APIError>) => {
  return useQuery({
    queryKey: queryKeys.integrations,
    queryFn: () => apiClient.getIntegrations(),
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

export const useIntegration = (id: string, options?: UseQueryOptions<Integration, APIError>) => {
  return useQuery({
    queryKey: queryKeys.integration(id),
    queryFn: () => apiClient.getIntegration(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
    ...options,
  });
};

export const useCreateIntegration = (options?: UseMutationOptions<Integration, APIError, CreateIntegrationRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (integration: CreateIntegrationRequest) => apiClient.createIntegration(integration),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success('Integration created successfully');
    },
    onError: (error) => handleError(error, 'Failed to create integration'),
    ...options,
  });
};

export const useUpdateIntegration = (options?: UseMutationOptions<Integration, APIError, { id: string; integration: Partial<CreateIntegrationRequest> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, integration }) => apiClient.updateIntegration(id, integration),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(queryKeys.integration(id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      toast.success('Integration updated successfully');
    },
    onError: (error) => handleError(error, 'Failed to update integration'),
    ...options,
  });
};

export const useDeleteIntegration = (options?: UseMutationOptions<void, APIError, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteIntegration(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.integration(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success('Integration deleted successfully');
    },
    onError: (error) => handleError(error, 'Failed to delete integration'),
    ...options,
  });
};

// Execution Hooks
export const useExecutions = (options?: UseQueryOptions<Execution[], APIError>) => {
  return useQuery({
    queryKey: queryKeys.executions,
    queryFn: () => apiClient.getExecutions(),
    staleTime: 10000, // 10 seconds (executions change frequently)
    ...options,
  });
};

export const useExecution = (id: string, options?: UseQueryOptions<Execution, APIError>) => {
  return useQuery({
    queryKey: queryKeys.execution(id),
    queryFn: () => apiClient.getExecution(id),
    enabled: !!id,
    staleTime: 30000, // 30 seconds
    ...options,
  });
};

export const useExecutionsByWorkflow = (workflowId: string, options?: UseQueryOptions<Execution[], APIError>) => {
  return useQuery({
    queryKey: queryKeys.executionsByWorkflow(workflowId),
    queryFn: () => apiClient.getExecutionsByWorkflow(workflowId),
    enabled: !!workflowId,
    staleTime: 10000, // 10 seconds
    ...options,
  });
};

export const useExecutionsByAgent = (agentId: string, options?: UseQueryOptions<Execution[], APIError>) => {
  return useQuery({
    queryKey: queryKeys.executionsByAgent(agentId),
    queryFn: () => apiClient.getExecutionsByAgent(agentId),
    enabled: !!agentId,
    staleTime: 10000, // 10 seconds
    ...options,
  });
}; 