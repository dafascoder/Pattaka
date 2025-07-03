import React, { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useEnhancedWorkflowBuilderStore } from '@/stores/enhanced-workflow-builder-store';
import { useCreateFlow, useCreateFlowVersion, useUpdateFlowVersion, useExecuteFlow } from '@/hooks/useFlows';
import { EnhancedBuilderLayout } from './enhanced-builder-layout';
import { DebugPanel } from './debug-panel';
import type { Flow, FlowVersion, Project } from '@/types/api';

interface EnhancedFlowBuilderProps {
  project: Project;
  flow?: Flow | null;
  flowVersion?: FlowVersion | null;
  flowVersions?: FlowVersion[];
  isNewFlow: boolean;
  isNewVersion: boolean;
}

export function EnhancedFlowBuilder({
  project,
  flow,
  flowVersion,
  flowVersions = [],
  isNewFlow,
  isNewVersion,
}: EnhancedFlowBuilderProps) {
  const router = useRouter();
  const { 
    setProject, 
    setFlow, 
    loadFlowVersion, 
    clearFlow, 
    getFlowData, 
    markClean,
    run,
    debugPanelOpen,
    setDebugPanelOpen,
    setRun
  } = useEnhancedWorkflowBuilderStore();
  
  // Mutations
  const createFlowMutation = useCreateFlow();
  const createFlowVersionMutation = useCreateFlowVersion();
  const updateFlowVersionMutation = useUpdateFlowVersion();
  const executeFlowMutation = useExecuteFlow();

  // Initialize store when data changes
  useEffect(() => {
    // Set project
    setProject(project.id);
    
    // Set flow if provided
    if (flow) {
      setFlow(flow.id);
    }
    
    // Load flow version if provided
    if (flowVersion) {
      loadFlowVersion(flowVersion);
    } else if (isNewFlow) {
      // Initialize with empty state for new flow
      clearFlow();
    }
  }, [project, flow, flowVersion, isNewFlow, setProject, setFlow, loadFlowVersion, clearFlow]);

  // Handle flow creation
  const handleCreateFlow = async (flowData: { displayName: string; trigger: any; steps: any }) => {
    try {
      // Create the flow first
      const newFlow = await createFlowMutation.mutateAsync({
        projectId: project.id,
        data: {
          status: 'ENABLED',
        },
      });

      // Create the initial version
      const newVersion = await createFlowVersionMutation.mutateAsync({
        flowId: newFlow.id,
        data: {
          displayName: flowData.displayName,
          trigger: flowData.trigger,
          steps: flowData.steps,
          status: 'DRAFT',
        },
      });

      // Navigate to the new flow
      router.navigate({
        to: '/builder',
        search: {
          projectId: project.id,
          flowId: newFlow.id,
          versionId: newVersion.id,
        },
      });

      toast.success('Flow created successfully');
    } catch (error) {
      console.error('Failed to create flow:', error);
      toast.error('Failed to create flow');
    }
  };

  // Handle flow version save
  const handleSaveVersion = async () => {
    if (!flow || !flowVersion) {
      // Handle new flow creation
      const flowData = getFlowData();
      await handleCreateFlow({
        displayName: 'New Flow',
        ...flowData,
      });
      return;
    }

    try {
      const flowData = getFlowData();
      
      await updateFlowVersionMutation.mutateAsync({
        flowId: flow.id,
        versionId: flowVersion.id,
        data: {
          displayName: flowVersion.displayName,
          trigger: flowData.trigger,
          steps: flowData.steps,
          status: flowVersion.status || 'DRAFT',
        },
      });

      markClean();
      toast.success('Flow saved successfully');
    } catch (error) {
      console.error('Failed to save flow:', error);
      toast.error('Failed to save flow');
    }
  };

  // Handle flow execution
  const handleExecuteFlow = async () => {
    if (!flow) {
      toast.error('Please save the flow before executing');
      return;
    }

    try {
      // Open debug panel BEFORE starting execution to establish WebSocket connection
      setDebugPanelOpen(true);
      
      // Small delay to allow debug panel to initialize and connect WebSocket
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const flowRun = await executeFlowMutation.mutateAsync({
        flowId: flow.id,
        data: {
          environment: 'PRODUCTION',
          payload: {},
        },
      });

      // Set the run in the store
      setRun(flowRun);
      
      toast.success('Flow execution started');
    } catch (error) {
      console.error('Failed to execute flow:', error);
      toast.error('Failed to execute flow');
    }
  };

  // Handle revert changes
  const handleRevert = () => {
    if (flowVersion) {
      loadFlowVersion(flowVersion);
      toast.success('Changes reverted');
    } else {
      clearFlow();
      toast.success('Flow cleared');
    }
  };

  return (
    <>
      <EnhancedBuilderLayoutWithActions
        project={project}
        flow={flow}
        flowVersion={flowVersion}
        onSave={handleSaveVersion}
        onExecute={handleExecuteFlow}
        onRevert={handleRevert}
        isSaving={createFlowMutation.isPending || createFlowVersionMutation.isPending || updateFlowVersionMutation.isPending}
        isExecuting={executeFlowMutation.isPending}
      />
      <DebugPanel
        isOpen={debugPanelOpen}
        onClose={() => setDebugPanelOpen(false)}
        execution={run}
        projectId={project.id}
      />
    </>
  );
}

// Enhanced builder layout with integrated actions
interface EnhancedBuilderLayoutWithActionsProps {
  project: Project;
  flow?: Flow | null;
  flowVersion?: FlowVersion | null;
  onSave: () => void;
  onExecute: () => void;
  onRevert: () => void;
  isSaving: boolean;
  isExecuting: boolean;
}

function EnhancedBuilderLayoutWithActions({
  project,
  flow,
  flowVersion,
  onSave,
  onExecute,
  onRevert,
  isSaving,
  isExecuting,
}: EnhancedBuilderLayoutWithActionsProps) {
  const isDirty = useEnhancedWorkflowBuilderStore((s) => s.isDirty);

  return (
    <div className="flex h-screen flex-col">
      {/* Enhanced Builder Header with actions */}
      <EnhancedBuilderHeader
        project={project}
        flow={flow}
        flowVersion={flowVersion}
        onSave={onSave}
        onExecute={onExecute}
        onRevert={onRevert}
        isSaving={isSaving}
        isExecuting={isExecuting}
        isDirty={isDirty}
      />
      
      {/* Main Builder Layout */}
      <div className="flex-1 overflow-hidden">
        <EnhancedBuilderLayout />
      </div>
    </div>
  );
}

// Enhanced builder header with backend integration
interface EnhancedBuilderHeaderProps {
  project: Project;
  flow?: Flow | null;
  flowVersion?: FlowVersion | null;
  onSave: () => void;
  onExecute: () => void;
  onRevert: () => void;
  isSaving: boolean;
  isExecuting: boolean;
  isDirty: boolean;
}

function EnhancedBuilderHeader({
  project,
  flow,
  flowVersion,
  onSave,
  onExecute,
  onRevert,
  isSaving,
  isExecuting,
  isDirty,
}: EnhancedBuilderHeaderProps) {
  const { debugPanelOpen, setDebugPanelOpen } = useEnhancedWorkflowBuilderStore();
  const router = useRouter();

  const handleBackToFlows = () => {
    router.navigate({
      to: '/dashboard/project/$projectId/flows',
      params: { projectId: project.id },
    });
  };

  const getWorkflowName = () => {
    if (flowVersion?.displayName) {
      return flowVersion.displayName;
    }
    if (flow) {
      return `Flow ${flow.id}`;
    }
    return 'New Flow';
  };

  const getLastSaved = () => {
    if (flowVersion?.updated) {
      // Use a consistent format to avoid hydration mismatches
      const date = new Date(flowVersion.updated);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    }
    return undefined;
  };

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background shadow-sm">
      <div className="flex h-14 w-full items-center gap-4 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackToFlows}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to {project.displayName}
          </button>
          <span className="text-lg font-medium">{getWorkflowName()}</span>
          {isDirty && <span className="text-xs text-orange-600">• Unsaved changes</span>}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {getLastSaved() && <span>Last saved: {getLastSaved()}</span>}
          {isSaving && <span className="text-blue-600">Saving...</span>}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onExecute}
            disabled={isExecuting || !flow}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? '⏳' : '▶'} {isExecuting ? 'Running...' : 'Run'}
          </button>
          
          <button
            onClick={() => setDebugPanelOpen(!debugPanelOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-md transition-colors ${
              debugPanelOpen 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            🐛 Debug
          </button>
          
          <button
            onClick={onSave}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '⏳' : '💾'} {isSaving ? 'Saving...' : 'Save'}
          </button>
          
          <button
            onClick={onRevert}
            disabled={!isDirty}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↺ Revert
          </button>
        </div>
      </div>
    </header>
  );
} 