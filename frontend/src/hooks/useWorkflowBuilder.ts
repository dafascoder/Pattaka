import { useEnhancedWorkflowBuilderStore } from '@/stores/enhanced-workflow-builder-store';
import { useProjects, useProject } from './useProjects';
import { 
  useFlows, 
  useFlow, 
  useFlowVersions, 
  useFlowVersion,
  useFlowRuns,
  useFlowRun,
  useCreateFlow,
  useUpdateFlow,
  useDeleteFlow,
  useCreateFlowVersion,
  useUpdateFlowVersion,
  useDeleteFlowVersion,
  useExecuteFlow,
  usePauseFlowRun,
  useResumeFlowRun,
  useCancelFlowRun
} from './useFlows';
import { toast } from 'sonner';

/**
 * Main hook for workflow builder functionality
 * Combines the Zustand store for UI state with React Query hooks for server state
 */
export function useWorkflowBuilder() {
  // Store state and actions
  const store = useEnhancedWorkflowBuilderStore();
  const {
    projectId,
    flowId,
    flowVersionId,
    nodes,
    edges,
    selectedNodeId,
    isDirty,
    sidebarOpen,
    sidebarView,
    validationErrors,
    isValid,
    isTestMode,
    executionOverlayOpen,
    // Actions
    setProject,
    setFlow,
    setFlowVersion,
    loadFlowVersion,
    clearFlow,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    updateNodeData,
    selectNode,
    markDirty,
    markClean,
    setSidebarOpen,
    setSidebarView,
    validateFlow,
    clearValidationErrors,
    setTestMode,
    setExecutionOverlayOpen,
    getFlowData,
    reset,
  } = store;

  // Query hooks
  const projectsQuery = useProjects();
  const projectQuery = useProject(projectId || '', !!projectId);
  const flowsQuery = useFlows(projectId || '', !!projectId);
  const flowQuery = useFlow(projectId || '', flowId || '', !!projectId && !!flowId);
  const flowVersionsQuery = useFlowVersions(flowId || '', !!flowId);
  const flowVersionQuery = useFlowVersion(flowId || '', flowVersionId || '', !!flowId && !!flowVersionId);
  const flowRunsQuery = useFlowRuns(projectId || '', !!projectId);

  // Mutation hooks
  const createFlowMutation = useCreateFlow();
  const updateFlowMutation = useUpdateFlow();
  const deleteFlowMutation = useDeleteFlow();
  const createFlowVersionMutation = useCreateFlowVersion();
  const updateFlowVersionMutation = useUpdateFlowVersion();
  const deleteFlowVersionMutation = useDeleteFlowVersion();
  const executeFlowMutation = useExecuteFlow();
  const pauseFlowRunMutation = usePauseFlowRun();
  const resumeFlowRunMutation = useResumeFlowRun();
  const cancelFlowRunMutation = useCancelFlowRun();

  // Enhanced actions that combine store + API
  const actions = {
    // Project actions
    selectProject: (newProjectId: string) => {
      setProject(newProjectId);
      clearFlow(); // Clear current flow when switching projects
    },

    // Flow actions
    selectFlow: (newFlowId: string) => {
      setFlow(newFlowId);
      // Load the latest version of the flow
      const flow = flowsQuery.data?.find(f => f.id === newFlowId);
      if (flow) {
        // Load the flow version when available
        flowVersionsQuery.refetch();
      }
    },

    selectFlowVersion: (versionId: string) => {
      setFlowVersion(versionId);
    },

    // Enhanced load flow version that updates store
    loadFlowVersionData: (versionId: string) => {
      const version = flowVersionsQuery.data?.find(v => v.id === versionId);
      if (version) {
        setFlowVersion(versionId);
        loadFlowVersion(version);
      }
    },

    // Save current flow version
    saveFlowVersion: async () => {
      if (!flowId || !flowVersionId) {
        toast.error('No flow version selected');
        return;
      }

      const flowData = getFlowData();
      
      try {
        await updateFlowVersionMutation.mutateAsync({
          flowId,
          versionId: flowVersionId,
          data: {
            displayName: flowVersionQuery.data?.displayName || 'Untitled Flow',
            trigger: flowData.trigger,
            steps: flowData.steps,
          },
        });
        markClean();
        toast.success('Flow saved successfully');
      } catch (error) {
        console.error('Failed to save flow:', error);
        toast.error('Failed to save flow');
      }
    },

    // Create new flow version from current state
    saveAsNewVersion: async (displayName?: string) => {
      if (!flowId) {
        toast.error('No flow selected');
        return;
      }

      const flowData = getFlowData();
      
      try {
        const newVersion = await createFlowVersionMutation.mutateAsync({
          flowId,
          data: {
            displayName: displayName || `Version ${Date.now()}`,
            trigger: flowData.trigger,
            steps: flowData.steps,
          },
        });
        
        setFlowVersion(newVersion.id);
        markClean();
        toast.success('New version created successfully');
      } catch (error) {
        console.error('Failed to create new version:', error);
        toast.error('Failed to create new version');
      }
    },

    // Execute current flow
    executeCurrentFlow: async () => {
      if (!flowId) {
        toast.error('No flow selected');
        return;
      }

      if (!validateFlow()) {
        toast.error('Please fix validation errors before executing');
        return;
      }

      try {
        await executeFlowMutation.mutateAsync({
          flowId,
          data: {
            // Add any execution parameters here
          },
        });
        setExecutionOverlayOpen(true);
      } catch (error) {
        console.error('Failed to execute flow:', error);
        toast.error('Failed to execute flow');
      }
    },

    // Test mode toggle
    toggleTestMode: () => {
      setTestMode(!isTestMode);
    },

    // Validation with toast
    validateAndShowErrors: () => {
      const isValid = validateFlow();
      if (!isValid) {
        toast.error(`Flow has ${validationErrors.length} validation errors`);
      }
      return isValid;
    },
  };

  // Computed state
  const computed = {
    isLoading: projectsQuery.isLoading || flowsQuery.isLoading || flowVersionsQuery.isLoading,
    hasUnsavedChanges: isDirty,
    canSave: !!flowVersionId && isDirty && isValid,
    canExecute: !!flowId && isValid,
    currentProject: projectQuery.data,
    currentFlow: flowQuery.data,
    currentFlowVersion: flowVersionQuery.data,
    allProjects: projectsQuery.data || [],
    allFlows: flowsQuery.data || [],
    allFlowVersions: flowVersionsQuery.data || [],
    allFlowRuns: flowRunsQuery.data || [],
  };

  return {
    // Store state
    state: {
      projectId,
      flowId,
      flowVersionId,
      nodes,
      edges,
      selectedNodeId,
      isDirty,
      sidebarOpen,
      sidebarView,
      validationErrors,
      isValid,
      isTestMode,
      executionOverlayOpen,
    },

    // Query states
    queries: {
      projects: projectsQuery,
      project: projectQuery,
      flows: flowsQuery,
      flow: flowQuery,
      flowVersions: flowVersionsQuery,
      flowVersion: flowVersionQuery,
      flowRuns: flowRunsQuery,
    },

    // Mutations
    mutations: {
      createFlow: createFlowMutation,
      updateFlow: updateFlowMutation,
      deleteFlow: deleteFlowMutation,
      createFlowVersion: createFlowVersionMutation,
      updateFlowVersion: updateFlowVersionMutation,
      deleteFlowVersion: deleteFlowVersionMutation,
      executeFlow: executeFlowMutation,
      pauseFlowRun: pauseFlowRunMutation,
      resumeFlowRun: resumeFlowRunMutation,
      cancelFlowRun: cancelFlowRunMutation,
    },

    // Store actions
    actions: {
      // Basic store actions
      setProject,
      setFlow,
      setFlowVersion,
      loadFlowVersion,
      clearFlow,
      onNodesChange,
      onEdgesChange,
      onConnect,
      addNode,
      deleteNode,
      updateNodeData,
      selectNode,
      markDirty,
      markClean,
      setSidebarOpen,
      setSidebarView,
      validateFlow,
      clearValidationErrors,
      setTestMode,
      setExecutionOverlayOpen,
      getFlowData,
      reset,

      // Enhanced actions
      ...actions,
    },

    // Computed state
    computed,
  };
} 