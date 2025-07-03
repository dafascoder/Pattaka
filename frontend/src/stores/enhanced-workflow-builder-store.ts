import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { 
  Node, 
  Edge, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import type { FlowVersion, FlowRun, Flow } from '@/types/api';

// ===== FLOW TYPES =====

export interface FlowStep {
  name: string;
  type: 'TRIGGER' | 'ACTION' | 'LOOP' | 'ROUTER' | 'CODE';
  displayName: string;
  settings?: Record<string, any>;
  position?: { x: number; y: number };
  valid?: boolean;
  errors?: string[];
}

export interface FlowStepRun {
  stepName: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  duration?: number;
  output?: any;
  error?: string;
}

export interface StepNode extends Node {
  data: {
    stepName: string;
    stepType: 'trigger' | 'action' | 'branch';
    displayName: string;
    settings?: Record<string, any>;
    valid?: boolean;
    errors?: string[];
  };
}

export interface ValidationError {
  nodeId: string;
  stepName: string;
  errors: string[];
}

// ===== ENHANCED STORE TYPES =====

export type LeftSidebar = 'NONE' | 'PIECES' | 'RUNS' | 'VERSIONS' | 'COPILOT';
export type RightSidebar = 'NONE' | 'STEP_SETTINGS' | 'TEST_STEP' | 'RUN_DETAILS';

export interface EnhancedWorkflowBuilderState {
  // === PROJECT & FLOW STATE ===
  projectId: string | null;
  flowId: string | null;
  flowVersionId: string | null;
  flow: Flow | null;
  flowVersion: FlowVersion | null;
  
  // === FLOW DIAGRAM STATE ===
  nodes: StepNode[];
  edges: Edge[];
  
  // === UI STATE ===
  selectedNodeId: string | null;
  selectedStep: FlowStep | null;
  isDirty: boolean; // Whether the flow has unsaved changes
  readonly: boolean;
  
  // === SIDEBAR STATE ===
  leftSidebar: LeftSidebar;
  rightSidebar: RightSidebar;
  
  // === VALIDATION STATE ===
  validationErrors: ValidationError[];
  isValid: boolean;
  
  // === EXECUTION STATE ===
  isTestMode: boolean;
  executionOverlayOpen: boolean;
  run: FlowRun | null;
  sampleData: Record<string, unknown>;
  saving: boolean;
  
  // === DEBUG STATE ===
  debugPanelOpen: boolean;
  
  // === CANVAS STATE ===
  canvasPosition: { x: number; y: number; zoom: number };
  
  // === ACTIONS ===
  
  // Project & Flow actions
  setProject: (projectId: string) => void;
  setFlow: (flowId: string) => void;
  setFlowVersion: (versionId: string) => void;
  loadFlowVersion: (flowVersion: FlowVersion) => void;
  clearFlow: () => void;
  
  // Flow diagram actions
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: Omit<StepNode, 'id'> & { id?: string }) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<StepNode['data']>) => void;
  
  // Selection actions
  selectNode: (nodeId: string | null) => void;
  selectStepByName: (stepName: string | null) => void;
  removeStepSelection: () => void;
  
  // Save state actions
  markDirty: () => void;
  markClean: () => void;
  
  // Sidebar actions
  setLeftSidebar: (sidebar: LeftSidebar) => void;
  setRightSidebar: (sidebar: RightSidebar) => void;
  
  // Validation actions
  validateFlow: () => boolean;
  clearValidationErrors: () => void;
  getStepErrors: (stepName: string) => string[];
  
  // Execution actions
  setTestMode: (enabled: boolean) => void;
  setExecutionOverlayOpen: (open: boolean) => void;
  setRun: (run: FlowRun | null) => void;
  setSampleData: (data: Record<string, unknown>) => void;
  setSaving: (saving: boolean) => void;
  
  // Debug actions
  setDebugPanelOpen: (open: boolean) => void;
  
  // Canvas actions
  updateCanvasPosition: (position: { x: number; y: number; zoom: number }) => void;
  
  // Enhanced operations
  applyOperation: (operation: any) => void;
  
  // Utility actions
  getFlowData: () => { trigger: any; steps: any };
  reset: () => void;
}

// ===== INITIAL STATE =====

const initialState = {
  // Project & Flow state
  projectId: null,
  flowId: null,
  flowVersionId: null,
  flow: null,
  flowVersion: null,
  
  // Flow diagram state
  nodes: [],
  edges: [],
  
  // UI state
  selectedNodeId: null,
  selectedStep: null,
  isDirty: false,
  readonly: false,
  
  // Sidebar state
  leftSidebar: 'PIECES' as LeftSidebar,
  rightSidebar: 'NONE' as RightSidebar,
  
  // Validation state
  validationErrors: [],
  isValid: true,
  
  // Execution state
  isTestMode: false,
  executionOverlayOpen: false,
  run: null,
  sampleData: {},
  saving: false,
  
  // Debug state
  debugPanelOpen: false,
  
  // Canvas state
  canvasPosition: { x: 0, y: 0, zoom: 1 },
};

// ===== STORE =====

export const useEnhancedWorkflowBuilderStore = create<EnhancedWorkflowBuilderState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // === PROJECT & FLOW ACTIONS ===
      setProject: (projectId) => set({ projectId }),
      
      setFlow: (flowId) => set({ flowId, flowVersionId: null }),
      
      setFlowVersion: (versionId) => set({ flowVersionId: versionId }),
      
      loadFlowVersion: (flowVersion) => {
        try {
          // Parse the steps and trigger from the flow version
          const trigger = flowVersion.trigger || {};
          const steps = flowVersion.steps || {};
          
          // Convert to nodes and edges
          const nodes: StepNode[] = [];
          const edges: Edge[] = [];
          
          // Add trigger node if exists
          if (trigger && Object.keys(trigger).length > 0) {
            nodes.push({
              id: 'trigger',
              type: 'step',
              position: trigger.position || { x: 100, y: 100 },
              data: {
                stepName: 'trigger',
                stepType: 'trigger',
                displayName: trigger.displayName || 'Trigger',
                settings: trigger.settings || {},
                valid: true,
              },
            });
          }
          
          // Add step nodes
          Object.entries(steps).forEach(([stepName, stepData]: [string, any], index) => {
            nodes.push({
              id: stepName,
              type: 'step',
              position: stepData.position || { x: 100 + (index + 1) * 200, y: 100 },
              data: {
                stepName,
                stepType: stepData.type || 'action',
                displayName: stepData.displayName || stepName,
                settings: stepData.settings || {},
                valid: true,
              },
            });
            
            // Add edge from previous step
            if (index === 0 && trigger && Object.keys(trigger).length > 0) {
              edges.push({
                id: `trigger-${stepName}`,
                source: 'trigger',
                target: stepName,
              });
            } else if (index > 0) {
              const previousStepName = Object.keys(steps)[index - 1];
              edges.push({
                id: `${previousStepName}-${stepName}`,
                source: previousStepName,
                target: stepName,
              });
            }
          });
          
          set({
            flowVersion,
            flowVersionId: flowVersion.id,
            nodes,
            edges,
            isDirty: false,
            validationErrors: [],
            isValid: true,
          });
          
        } catch (error) {
          console.error('Failed to load flow version:', error);
        }
      },
      
      clearFlow: () => set({
        flowId: null,
        flowVersionId: null,
        flow: null,
        flowVersion: null,
        nodes: [],
        edges: [],
        selectedNodeId: null,
        selectedStep: null,
        isDirty: false,
        validationErrors: [],
        isValid: true,
      }),

      // === FLOW DIAGRAM ACTIONS ===
      onNodesChange: (changes) => {
        const { nodes } = get();
        const updatedNodes = applyNodeChanges(changes, nodes) as StepNode[];
        set({ nodes: updatedNodes, isDirty: true });
      },

      onEdgesChange: (changes) => {
        const { edges } = get();
        const updatedEdges = applyEdgeChanges(changes, edges);
        set({ edges: updatedEdges, isDirty: true });
      },

      onConnect: (connection) => {
        const { edges } = get();
        const updatedEdges = addEdge(connection, edges);
        set({ edges: updatedEdges, isDirty: true });
      },

      addNode: (nodeData) => {
        const id = nodeData.id || `step_${Date.now()}`;
        const newNode: StepNode = {
          id,
          type: 'step',
          position: nodeData.position || { x: 100, y: 100 },
          data: {
            stepName: nodeData.data.stepName || id,
            stepType: nodeData.data.stepType || 'action',
            displayName: nodeData.data.displayName || 'New Step', 
            settings: nodeData.data.settings || {},
            valid: true,
          },
        };

        const { nodes } = get();
        set({ nodes: [...nodes, newNode], isDirty: true });
      },

      deleteNode: (nodeId) => {
        const { nodes, edges, selectedNodeId, selectedStep } = get();
        const updatedNodes = nodes.filter((node) => node.id !== nodeId);
        const updatedEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
        const updatedSelectedNodeId = selectedNodeId === nodeId ? null : selectedNodeId;
        const updatedSelectedStep = updatedSelectedNodeId ? selectedStep : null;
        
        set({ 
          nodes: updatedNodes, 
          edges: updatedEdges, 
          selectedNodeId: updatedSelectedNodeId,
          selectedStep: updatedSelectedStep,
          isDirty: true 
        });
      },

      updateNodeData: (nodeId, data) => {
        const { nodes } = get();
        const updatedNodes = nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        );
        set({ nodes: updatedNodes, isDirty: true });
      },

      // === SELECTION ACTIONS ===
      selectNode: (nodeId) => {
        const { nodes } = get();
        const selectedNode = nodeId ? nodes.find(n => n.id === nodeId) : null;
        const selectedStep = selectedNode ? {
          name: selectedNode.data.stepName,
          type: selectedNode.data.stepType === 'trigger' ? 'TRIGGER' : 'ACTION' as const,
          displayName: selectedNode.data.displayName,
          settings: selectedNode.data.settings || {},
          valid: selectedNode.data.valid,
          errors: selectedNode.data.errors,
        } : null;
        
        set({ 
          selectedNodeId: nodeId,
          selectedStep: selectedStep as FlowStep | null,
          rightSidebar: nodeId ? 'STEP_SETTINGS' : 'NONE'
        });
      },

      selectStepByName: (stepName) => {
        const { nodes } = get();
        const selectedNode = stepName ? nodes.find(n => n.data.stepName === stepName) : null;
        const nodeId = selectedNode?.id || null;
        
        // Directly update state instead of calling selectNode to avoid circular dependency
        const selectedStep = selectedNode ? {
          name: selectedNode.data.stepName,
          type: selectedNode.data.stepType === 'trigger' ? 'TRIGGER' : 'ACTION' as const,
          displayName: selectedNode.data.displayName,
          settings: selectedNode.data.settings || {},
          valid: selectedNode.data.valid,
          errors: selectedNode.data.errors,
        } : null;
        
        set({ 
          selectedNodeId: nodeId,
          selectedStep: selectedStep as FlowStep | null,
          rightSidebar: nodeId ? 'STEP_SETTINGS' : 'NONE'
        });
      },

      removeStepSelection: () => {
        set({ 
          selectedNodeId: null,
          selectedStep: null,
          rightSidebar: 'NONE'
        });
      },

      // === SAVE STATE ACTIONS ===
      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false }),

      // === SIDEBAR ACTIONS ===
      setLeftSidebar: (sidebar) => set({ leftSidebar: sidebar }),
      setRightSidebar: (sidebar) => set({ rightSidebar: sidebar }),

      // === VALIDATION ACTIONS ===
      validateFlow: () => {
        const { nodes } = get();
        const errors: ValidationError[] = [];
        
        // Validate each node
        nodes.forEach((node) => {
          const nodeErrors: string[] = [];
          
          // Basic validation
          if (!node.data.displayName) {
            nodeErrors.push('Display name is required');
          }
          
          // Trigger validation
          if (node.data.stepType === 'trigger') {
            if (!node.data.settings?.type) {
              nodeErrors.push('Trigger type is required');
            }
          }
          
          // Action validation
          if (node.data.stepType === 'action') {
            if (!node.data.settings?.actionType) {
              nodeErrors.push('Action type is required');
            }
          }
          
          if (nodeErrors.length > 0) {
            errors.push({
              nodeId: node.id,
              stepName: node.data.stepName,
              errors: nodeErrors,
            });
          }
        });
        
        // Only update validation state, not the nodes themselves to avoid loops
        set({
          validationErrors: errors,
          isValid: errors.length === 0,
        });
        
        return errors.length === 0;
      },

      clearValidationErrors: () => {
        const { nodes } = get();
        const updatedNodes = nodes.map((node) => ({
          ...node,
          data: { ...node.data, valid: true, errors: [] },
        }));
        
        set({
          validationErrors: [],
          isValid: true,
          nodes: updatedNodes,
        });
      },

      getStepErrors: (stepName) => {
        const { validationErrors } = get();
        const error = validationErrors.find(e => e.stepName === stepName);
        return error?.errors || [];
      },

      // === EXECUTION ACTIONS ===
      setTestMode: (enabled) => set({ isTestMode: enabled }),
      setExecutionOverlayOpen: (open) => set({ executionOverlayOpen: open }),
      setRun: (run) => set({ run }),
      setSampleData: (data) => set({ sampleData: data }),
      setSaving: (saving) => set({ saving }),
      
      // === DEBUG ACTIONS ===
      setDebugPanelOpen: (open) => set({ debugPanelOpen: open }),

      // === CANVAS ACTIONS ===
      updateCanvasPosition: (position) => set({ canvasPosition: position }),

      // === ENHANCED OPERATIONS ===
      applyOperation: (operation) => {
        const { nodes, edges } = get();
        
        try {
          switch (operation.type) {
            case 'ADD_ACTION': {
              const { request } = operation;
              const newNode: StepNode = {
                id: request.stepName,
                type: 'step',
                position: request.position || { x: 100 + nodes.length * 200, y: 100 },
                data: {
                  stepName: request.stepName,
                  stepType: 'action',
                  displayName: request.displayName || 'New Action',
                  settings: request.settings || {},
                  valid: true,
                },
              };
              
              set({ 
                nodes: [...nodes, newNode], 
                isDirty: true 
              });
              break;
            }
            
            case 'UPDATE_TRIGGER': {
              const { request } = operation;
              const existingTriggerIndex = nodes.findIndex(n => n.data.stepType === 'trigger');
              
              if (existingTriggerIndex >= 0) {
                // Update existing trigger
                const updatedNodes = [...nodes];
                updatedNodes[existingTriggerIndex] = {
                  ...updatedNodes[existingTriggerIndex],
                  data: {
                    ...updatedNodes[existingTriggerIndex].data,
                    displayName: request.displayName,
                    settings: request.settings || {},
                  },
                };
                set({ nodes: updatedNodes, isDirty: true });
              } else {
                // Create new trigger
                const triggerNode: StepNode = {
                  id: 'trigger',
                  type: 'step',
                  position: { x: 100, y: 100 },
                  data: {
                    stepName: 'trigger',
                    stepType: 'trigger',
                    displayName: request.displayName || 'Trigger',
                    settings: request.settings || {},
                    valid: true,
                  },
                };
                
                set({ 
                  nodes: [triggerNode, ...nodes], 
                  isDirty: true 
                });
              }
              break;
            }
            
            case 'DELETE_ACTION': {
              const { request } = operation;
              const updatedNodes = nodes.filter(n => n.data.stepName !== request.stepName);
              const updatedEdges = edges.filter(e => 
                e.source !== request.stepName && e.target !== request.stepName
              );
              
              set({ 
                nodes: updatedNodes, 
                edges: updatedEdges, 
                isDirty: true 
              });
              break;
            }
            
            case 'DUPLICATE_ACTION': {
              const { request } = operation;
              const originalNode = nodes.find(n => n.data.stepName === request.stepName);
              
              if (originalNode) {
                const duplicatedNode: StepNode = {
                  ...originalNode,
                  id: `${request.stepName}_copy_${Date.now()}`,
                  position: {
                    x: originalNode.position.x + 200,
                    y: originalNode.position.y + 50,
                  },
                  data: {
                    ...originalNode.data,
                    stepName: `${request.stepName}_copy_${Date.now()}`,
                    displayName: `${originalNode.data.displayName} (Copy)`,
                  },
                };
                
                set({ 
                  nodes: [...nodes, duplicatedNode], 
                  isDirty: true 
                });
              }
              break;
            }
            
            case 'UPDATE_ACTION': {
              const { request } = operation;
              const updatedNodes = nodes.map(node =>
                node.data.stepName === request.stepName
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        displayName: request.displayName || node.data.displayName,
                        settings: { ...node.data.settings, ...request.settings },
                      },
                    }
                  : node
              );
              
              set({ nodes: updatedNodes, isDirty: true });
              break;
            }
            
            case 'SKIP_ACTION': {
              const { request } = operation;
              const updatedNodes = nodes.map(node =>
                node.data.stepName === request.stepName
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        settings: {
                          ...node.data.settings,
                          skip: request.skip,
                        },
                      },
                    }
                  : node
              );
              
              set({ nodes: updatedNodes, isDirty: true });
              break;
            }
            
            default:
              console.warn('Unknown operation type:', operation.type);
              set({ isDirty: true });
          }
        } catch (error) {
          console.error('Failed to apply operation:', error);
        }
      },

      // === UTILITY ACTIONS ===
      getFlowData: () => {
        const { nodes } = get();
        
        const trigger = nodes.find((node) => node.data.stepType === 'trigger');
        const stepNodes = nodes.filter((node) => node.data.stepType !== 'trigger');
        
        const flowData = {
          trigger: trigger ? {
            type: trigger.data.settings?.type || '',
            displayName: trigger.data.displayName,
            settings: trigger.data.settings || {},
            position: trigger.position,
          } : {},
          steps: stepNodes.reduce((acc, node) => {
            acc[node.data.stepName] = {
              type: node.data.stepType,
              displayName: node.data.displayName,
              settings: node.data.settings || {},
              position: node.position,
            };
            return acc;
          }, {} as Record<string, any>),
        };
        
        return flowData;
      },

      reset: () => set(initialState),
    }),
    {
      name: 'enhanced-workflow-builder-storage',
    }
  )
); 