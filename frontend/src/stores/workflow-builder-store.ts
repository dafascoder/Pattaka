import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  PALETTE_ITEMS, 
  createAgentPaletteItem, 
  getPaletteItemsByCategory,
  type PaletteItem,
  type Agent,
  type Node
} from '@/components/builder/nodes/node-types'
import { Edge, Connection, addEdge, Node as FlowNode } from '@xyflow/react'
import { useMemo } from 'react'

// Extended types for the store
interface WorkflowNode extends FlowNode {
  data: {
    label: string
    nodeType: string
    subType?: string
    config?: Record<string, any>
  }
}

interface DragState {
  isDragging: boolean
  draggedItem: PaletteItem | null
  draggedItemId: string | null
}

interface UIState {
  sidebarExpanded: boolean
  selectedNodeId: string | null
  configPanelOpen: boolean
  searchTerm: string
}

interface WorkflowState {
  nodes: WorkflowNode[]
  edges: Edge[]
  hasTrigger: boolean
  workflowName: string
  workflowDescription: string
  isModified: boolean
}

interface AgentsState {
  agents: Agent[]
  agentPaletteItems: PaletteItem[]
  loadingAgents: boolean
  agentsError: string | null
}

interface WorkflowBuilderState {
  // UI State
  ui: UIState
  
  // Drag State
  drag: DragState
  
  // Workflow State
  workflow: WorkflowState
  
  // Agents State
  agents: AgentsState
  
  // UI Actions
  setSearchTerm: (term: string) => void
  toggleSidebar: () => void
  setSidebarExpanded: (expanded: boolean) => void
  selectNode: (nodeId: string | null) => void
  setConfigPanelOpen: (open: boolean) => void
  
  // Drag Actions
  startDrag: (item: PaletteItem) => void
  endDrag: () => void
  
  // Workflow Actions
  addNode: (paletteItem: PaletteItem, position: { x: number; y: number }) => void
  removeNode: (nodeId: string) => void
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void
  addEdge: (connection: Connection) => void
  removeEdge: (edgeId: string) => void
  updateEdges: (edges: Edge[]) => void
  setNodes: (nodes: WorkflowNode[]) => void
  setWorkflowInfo: (info: { name?: string; description?: string }) => void
  markAsModified: () => void
  clearWorkflow: () => void
  
  // Agents Actions
  setAgents: (agents: Agent[]) => void
  addAgent: (agent: Agent) => void
  removeAgent: (agentId: string) => void
  updateAgent: (agentId: string, updates: Partial<Agent>) => void
  setAgentsLoading: (loading: boolean) => void
  setAgentsError: (error: string | null) => void
  
  // Utility Actions
  reset: () => void
  exportWorkflow: () => object
  importWorkflow: (workflow: object) => void
}

const initialState = {
  ui: {
    sidebarExpanded: true,
    selectedNodeId: null,
    configPanelOpen: false,
    searchTerm: '',
  },
  drag: {
    isDragging: false,
    draggedItem: null,
    draggedItemId: null,
  },
  workflow: {
    nodes: [],
    edges: [],
    hasTrigger: false,
    workflowName: 'Untitled Workflow',
    workflowDescription: '',
    isModified: false,
  },
  agents: {
    agents: [],
    agentPaletteItems: [],
    loadingAgents: false,
    agentsError: null,
  },
}

export const useWorkflowBuilderStore = create<WorkflowBuilderState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // UI Actions
      setSearchTerm: (term: string) =>
        set(
          (state) => ({
            ui: { ...state.ui, searchTerm: term },
          }),
          false,
          'setSearchTerm'
        ),
      
      toggleSidebar: () =>
        set(
          (state) => ({
            ui: { ...state.ui, sidebarExpanded: !state.ui.sidebarExpanded },
          }),
          false,
          'toggleSidebar'
        ),
      
      setSidebarExpanded: (expanded: boolean) =>
        set(
          (state) => ({
            ui: { ...state.ui, sidebarExpanded: expanded },
          }),
          false,
          'setSidebarExpanded'
        ),
      
      selectNode: (nodeId: string | null) =>
        set(
          (state) => ({
            ui: { 
              ...state.ui, 
              selectedNodeId: nodeId,
              configPanelOpen: nodeId !== null 
            },
          }),
          false,
          'selectNode'
        ),
      
      setConfigPanelOpen: (open: boolean) =>
        set(
          (state) => ({
            ui: { ...state.ui, configPanelOpen: open },
          }),
          false,
          'setConfigPanelOpen'
        ),
      
      // Drag Actions
      startDrag: (item: PaletteItem) =>
        set(
          (state) => ({
            drag: {
              isDragging: true,
              draggedItem: item,
              draggedItemId: item.id,
            },
          }),
          false,
          'startDrag'
        ),
      
      endDrag: () =>
        set(
          (state) => ({
            drag: {
              isDragging: false,
              draggedItem: null,
              draggedItemId: null,
            },
          }),
          false,
          'endDrag'
        ),
      
      // Workflow Actions
      addNode: (paletteItem: PaletteItem, position: { x: number; y: number }) =>
        set(
          (state) => {
            const nodeId = `${paletteItem.type}-${Date.now()}`
            const newNode: WorkflowNode = {
              id: nodeId,
              type: paletteItem.type,
              position,
              data: {
                label: paletteItem.name,
                nodeType: paletteItem.type,
                subType: paletteItem.subType,
                config: paletteItem.config?.defaultSettings || {},
              },
              draggable: true,
            }
            
            const newHasTrigger = state.workflow.hasTrigger || paletteItem.category === 'triggers'
            
            return {
              workflow: {
                ...state.workflow,
                nodes: [...state.workflow.nodes, newNode],
                hasTrigger: newHasTrigger,
                isModified: true,
              },
            }
          },
          false,
          'addNode'
        ),
      
      removeNode: (nodeId: string) =>
        set(
          (state) => {
            const nodeToRemove = state.workflow.nodes.find(n => n.id === nodeId)
            const newNodes = state.workflow.nodes.filter(n => n.id !== nodeId)
            const newEdges = state.workflow.edges.filter(
              e => e.source !== nodeId && e.target !== nodeId
            )
            
            const newHasTrigger = nodeToRemove?.data?.nodeType === 'trigger' 
              ? newNodes.some(n => n.data.nodeType === 'trigger')
              : state.workflow.hasTrigger
            
            return {
              workflow: {
                ...state.workflow,
                nodes: newNodes,
                edges: newEdges,
                hasTrigger: newHasTrigger,
                isModified: true,
              },
              ui: {
                ...state.ui,
                selectedNodeId: state.ui.selectedNodeId === nodeId ? null : state.ui.selectedNodeId,
              },
            }
          },
          false,
          'removeNode'
        ),
      
      updateNode: (nodeId: string, updates: Partial<WorkflowNode>) =>
        set(
          (state) => ({
            workflow: {
              ...state.workflow,
              nodes: state.workflow.nodes.map(node =>
                node.id === nodeId ? { ...node, ...updates } : node
              ),
              isModified: true,
            },
          }),
          false,
          'updateNode'
        ),
      
      addEdge: (connection: Connection) =>
        set(
          (state) => {
            const newEdge = {
              id: `edge-${connection.source}-${connection.target}`,
              source: connection.source!,
              target: connection.target!,
              sourceHandle: connection.sourceHandle,
              targetHandle: connection.targetHandle,
            }
            
            return {
              workflow: {
                ...state.workflow,
                edges: addEdge(newEdge, state.workflow.edges),
                isModified: true,
              },
            }
          },
          false,
          'addEdge'
        ),
      
      removeEdge: (edgeId: string) =>
        set(
          (state) => ({
            workflow: {
              ...state.workflow,
              edges: state.workflow.edges.filter(e => e.id !== edgeId),
              isModified: true,
            },
          }),
          false,
          'removeEdge'
        ),
      
      updateEdges: (edges: Edge[]) =>
        set(
          (state) => ({
            workflow: {
              ...state.workflow,
              edges,
              isModified: true,
            },
          }),
          false,
          'updateEdges'
        ),
      
      setNodes: (nodes: WorkflowNode[]) =>
        set(
          (state) => ({
            workflow: {
              ...state.workflow,
              nodes,
              hasTrigger: nodes.some(n => n.data.nodeType === 'trigger'),
              isModified: true,
            },
          }),
          false,
          'setNodes'
        ),
      
      setWorkflowInfo: (info: { name?: string; description?: string }) =>
        set(
          (state) => ({
            workflow: {
              ...state.workflow,
              ...(info.name && { workflowName: info.name }),
              ...(info.description && { workflowDescription: info.description }),
              isModified: true,
            },
          }),
          false,
          'setWorkflowInfo'
        ),
      
      markAsModified: () =>
        set(
          (state) => ({
            workflow: {
              ...state.workflow,
              isModified: true,
            },
          }),
          false,
          'markAsModified'
        ),
      
      clearWorkflow: () =>
        set(
          (state) => ({
            workflow: {
              ...initialState.workflow,
              workflowName: 'Untitled Workflow',
            },
            ui: {
              ...state.ui,
              selectedNodeId: null,
              configPanelOpen: false,
            },
          }),
          false,
          'clearWorkflow'
        ),
      
      // Agents Actions
      setAgents: (agents: Agent[]) =>
        set(
          (state) => ({
            agents: {
              ...state.agents,
              agents,
              agentPaletteItems: agents.map(agent => createAgentPaletteItem(agent)),
              loadingAgents: false,
              agentsError: null,
            },
          }),
          false,
          'setAgents'
        ),
      
      addAgent: (agent: Agent) =>
        set(
          (state) => {
            const newAgents = [...state.agents.agents, agent]
            return {
              agents: {
                ...state.agents,
                agents: newAgents,
                agentPaletteItems: newAgents.map(a => createAgentPaletteItem(a)),
              },
            }
          },
          false,
          'addAgent'
        ),
      
      removeAgent: (agentId: string) =>
        set(
          (state) => {
            const newAgents = state.agents.agents.filter(a => a.id !== agentId)
            return {
              agents: {
                ...state.agents,
                agents: newAgents,
                agentPaletteItems: newAgents.map(a => createAgentPaletteItem(a)),
              },
            }
          },
          false,
          'removeAgent'
        ),
      
      updateAgent: (agentId: string, updates: Partial<Agent>) =>
        set(
          (state) => {
            const newAgents = state.agents.agents.map(agent =>
              agent.id === agentId ? { ...agent, ...updates } : agent
            )
            return {
              agents: {
                ...state.agents,
                agents: newAgents,
                agentPaletteItems: newAgents.map(a => createAgentPaletteItem(a)),
              },
            }
          },
          false,
          'updateAgent'
        ),
      
      setAgentsLoading: (loading: boolean) =>
        set(
          (state) => ({
            agents: {
              ...state.agents,
              loadingAgents: loading,
            },
          }),
          false,
          'setAgentsLoading'
        ),
      
      setAgentsError: (error: string | null) =>
        set(
          (state) => ({
            agents: {
              ...state.agents,
              agentsError: error,
              loadingAgents: false,
            },
          }),
          false,
          'setAgentsError'
        ),
      
      // Utility Actions
      reset: () =>
        set(
          () => ({ ...initialState }),
          false,
          'reset'
        ),
      
      exportWorkflow: () => {
        const { workflow } = get()
        return {
          name: workflow.workflowName,
          description: workflow.workflowDescription,
          nodes: workflow.nodes,
          edges: workflow.edges,
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
        }
      },
      
      importWorkflow: (workflowData: any) =>
        set(
          (state) => ({
            workflow: {
              ...state.workflow,
              workflowName: workflowData.name || 'Imported Workflow',
              workflowDescription: workflowData.description || '',
              nodes: workflowData.nodes || [],
              edges: workflowData.edges || [],
              hasTrigger: (workflowData.nodes || []).some((n: any) => n.data?.nodeType === 'trigger'),
              isModified: false,
            },
            ui: {
              ...state.ui,
              selectedNodeId: null,
              configPanelOpen: false,
            },
          }),
          false,
          'importWorkflow'
        ),
    }),
    {
      name: 'workflow-builder-store',
      version: 1,
    }
  )
)

// Selectors for better performance - these are memoized and safe
export const useSearchTerm = () => useWorkflowBuilderStore(state => state.ui.searchTerm)
export const useDragState = () => useWorkflowBuilderStore(state => state.drag)
export const useWorkflowNodes = () => useWorkflowBuilderStore(state => state.workflow.nodes)
export const useWorkflowEdges = () => useWorkflowBuilderStore(state => state.workflow.edges)
export const useHasTrigger = () => useWorkflowBuilderStore(state => state.workflow.hasTrigger)
export const useAgents = () => useWorkflowBuilderStore(state => state.agents.agents)
export const useAgentPaletteItems = () => useWorkflowBuilderStore(state => state.agents.agentPaletteItems)
export const useSelectedNodeId = () => useWorkflowBuilderStore(state => state.ui.selectedNodeId)
export const useSidebarExpanded = () => useWorkflowBuilderStore(state => state.ui.sidebarExpanded)

// Corrected computed selector with useMemo to prevent infinite loops
export const useFilteredPaletteItems = () => {
  const searchTerm = useSearchTerm()
  const agentPaletteItems = useAgentPaletteItems()

  return useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    
    const filterItems = (items: PaletteItem[]) =>
      items.filter(item =>
        item.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        item.description.toLowerCase().includes(lowerCaseSearchTerm)
      )
    
    return {
      triggers: filterItems(getPaletteItemsByCategory('triggers')),
      actions: filterItems(getPaletteItemsByCategory('actions')),
      logic: filterItems(getPaletteItemsByCategory('logic')),
      agents: filterItems(agentPaletteItems),
    }
  }, [searchTerm, agentPaletteItems])
} 