import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flowService } from '@/services/flow-service';
import type { 
  Flow, 
  FlowVersion, 
  FlowRun,
  CreateFlowRequest, 
  UpdateFlowRequest,
  CreateFlowVersionRequest,
  UpdateFlowVersionRequest,
  ExecuteFlowRequest 
} from '@/types/api';
import { toast } from 'sonner';

// Query Keys
export const flowKeys = {
  all: ['flows'] as const,
  lists: () => [...flowKeys.all, 'list'] as const,
  list: (projectId: string) => [...flowKeys.lists(), { projectId }] as const,
  details: () => [...flowKeys.all, 'detail'] as const,
  detail: (projectId: string, flowId: string) => [...flowKeys.details(), { projectId, flowId }] as const,
  
  // Flow Versions
  versions: (flowId: string) => [...flowKeys.all, 'versions', flowId] as const,
  version: (flowId: string, versionId: string) => [...flowKeys.versions(flowId), versionId] as const,
  
  // Flow Runs
  runs: (projectId: string) => [...flowKeys.all, 'runs', projectId] as const,
  run: (runId: string) => [...flowKeys.all, 'run', runId] as const,
};

// ===== FLOW HOOKS =====

export function useFlows(projectId: string, enabled = true) {
  return useQuery({
    queryKey: flowKeys.list(projectId),
    queryFn: () => flowService.getFlows(projectId),
    enabled: enabled && !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useFlow(projectId: string, flowId: string, enabled = true) {
  return useQuery({
    queryKey: flowKeys.detail(projectId, flowId),
    queryFn: () => flowService.getFlow(projectId, flowId),
    enabled: enabled && !!projectId && !!flowId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateFlowRequest }) =>
      flowService.createFlow(projectId, data),
    onSuccess: (newFlow, { projectId }) => {
      // Invalidate flows list for this project
      queryClient.invalidateQueries({ queryKey: flowKeys.list(projectId) });
      
      // Add new flow to cache
      queryClient.setQueryData(flowKeys.detail(projectId, newFlow.id), newFlow);
      
      toast.success('Flow created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create flow: ${error.message}`);
    },
  });
}

export function useUpdateFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, flowId, data }: { 
      projectId: string; 
      flowId: string; 
      data: UpdateFlowRequest 
    }) => flowService.updateFlow(projectId, flowId, data),
    onSuccess: (updatedFlow, { projectId, flowId }) => {
      // Update flow in cache
      queryClient.setQueryData(flowKeys.detail(projectId, flowId), updatedFlow);
      
      // Invalidate flows list
      queryClient.invalidateQueries({ queryKey: flowKeys.list(projectId) });
      
      toast.success('Flow updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update flow: ${error.message}`);
    },
  });
}

export function useDeleteFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, flowId }: { projectId: string; flowId: string }) =>
      flowService.deleteFlow(projectId, flowId),
    onSuccess: (_, { projectId, flowId }) => {
      // Remove flow from cache
      queryClient.removeQueries({ queryKey: flowKeys.detail(projectId, flowId) });
      
      // Remove all related versions and runs
      queryClient.removeQueries({ queryKey: flowKeys.versions(flowId) });
      
      // Invalidate flows list
      queryClient.invalidateQueries({ queryKey: flowKeys.list(projectId) });
      
      toast.success('Flow deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete flow: ${error.message}`);
    },
  });
}

// ===== FLOW VERSION HOOKS =====

export function useFlowVersions(flowId: string, enabled = true) {
  return useQuery({
    queryKey: flowKeys.versions(flowId),
    queryFn: () => flowService.getFlowVersions(flowId),
    enabled: enabled && !!flowId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useFlowVersion(flowId: string, versionId: string, enabled = true) {
  return useQuery({
    queryKey: flowKeys.version(flowId, versionId),
    queryFn: () => flowService.getFlowVersion(flowId, versionId),
    enabled: enabled && !!flowId && !!versionId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFlowVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flowId, data }: { flowId: string; data: CreateFlowVersionRequest }) =>
      flowService.createFlowVersion(flowId, data),
    onSuccess: (newVersion, { flowId }) => {
      // Invalidate versions list
      queryClient.invalidateQueries({ queryKey: flowKeys.versions(flowId) });
      
      // Add new version to cache
      queryClient.setQueryData(flowKeys.version(flowId, newVersion.id), newVersion);
      
      toast.success('Flow version created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create flow version: ${error.message}`);
    },
  });
}

export function useUpdateFlowVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flowId, versionId, data }: { 
      flowId: string; 
      versionId: string; 
      data: UpdateFlowVersionRequest 
    }) => flowService.updateFlowVersion(flowId, versionId, data),
    onSuccess: (updatedVersion, { flowId, versionId }) => {
      // Update version in cache
      queryClient.setQueryData(flowKeys.version(flowId, versionId), updatedVersion);
      
      // Invalidate versions list
      queryClient.invalidateQueries({ queryKey: flowKeys.versions(flowId) });
      
      toast.success('Flow version updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update flow version: ${error.message}`);
    },
  });
}

export function useDeleteFlowVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flowId, versionId }: { flowId: string; versionId: string }) =>
      flowService.deleteFlowVersion(flowId, versionId),
    onSuccess: (_, { flowId, versionId }) => {
      // Remove version from cache
      queryClient.removeQueries({ queryKey: flowKeys.version(flowId, versionId) });
      
      // Invalidate versions list
      queryClient.invalidateQueries({ queryKey: flowKeys.versions(flowId) });
      
      toast.success('Flow version deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete flow version: ${error.message}`);
    },
  });
}

// ===== FLOW EXECUTION HOOKS =====

export function useExecuteFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ flowId, data }: { flowId: string; data: ExecuteFlowRequest }) =>
      flowService.executeFlow(flowId, data),
    onSuccess: (flowRun) => {
      // Add new run to cache
      queryClient.setQueryData(flowKeys.run(flowRun.id), flowRun);
      
      // Invalidate runs list for the project
      queryClient.invalidateQueries({ queryKey: flowKeys.runs(flowRun.projectId) });
      
      toast.success('Flow execution started successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to execute flow: ${error.message}`);
    },
  });
}

// ===== FLOW RUN HOOKS =====

export function useFlowRuns(projectId: string, enabled = true) {
  return useQuery({
    queryKey: flowKeys.runs(projectId),
    queryFn: () => flowService.getFlowRuns(projectId),
    enabled: enabled && !!projectId,
    staleTime: 30 * 1000, // 30 seconds (runs change frequently)
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for live updates
  });
}

export function useFlowRun(runId: string, enabled = true) {
  return useQuery({
    queryKey: flowKeys.run(runId),
    queryFn: () => flowService.getFlowRun(runId),
    enabled: enabled && !!runId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: (data) => {
      // Only refetch if the run is still in progress
      const isRunning = data?.status === 'RUNNING' || data?.status === 'PAUSED';
      return isRunning ? 2 * 1000 : false; // 2 seconds if running, no refetch if completed
    },
  });
}

export function usePauseFlowRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (runId: string) => flowService.pauseFlowRun(runId),
    onSuccess: (_, runId) => {
      // Invalidate the specific run to refetch updated status
      queryClient.invalidateQueries({ queryKey: flowKeys.run(runId) });
      
      toast.success('Flow run paused successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to pause flow run: ${error.message}`);
    },
  });
}

export function useResumeFlowRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (runId: string) => flowService.resumeFlowRun(runId),
    onSuccess: (_, runId) => {
      // Invalidate the specific run to refetch updated status
      queryClient.invalidateQueries({ queryKey: flowKeys.run(runId) });
      
      toast.success('Flow run resumed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to resume flow run: ${error.message}`);
    },
  });
}

export function useCancelFlowRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (runId: string) => flowService.cancelFlowRun(runId),
    onSuccess: (_, runId) => {
      // Invalidate the specific run to refetch updated status
      queryClient.invalidateQueries({ queryKey: flowKeys.run(runId) });
      
      toast.success('Flow run cancelled successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel flow run: ${error.message}`);
    },
  });
} 