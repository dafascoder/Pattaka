import { useState, useCallback, useEffect, useRef, DragEvent } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  IconFileAi, 
  IconArrowLeft,
  IconDownload,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { ComponentPalette } from '@/components/workflow/component-palette'
import { NodeConfigurationPanel } from '@/components/workflow/node-configuration-panel'
import { nodeTypes } from '@/components/workflow/custom-nodes'

export const Route = createFileRoute('/(authenticated)/builder')({
  component: () => (
    <ReactFlowProvider>
      <WorkflowBuilderPage />
    </ReactFlowProvider>
  ),
})

// Types
interface CustomNodeData extends Record<string, unknown> {
  label: string
  nodeType: string
  config?: {
    name?: string
    description?: string
    settings?: Record<string, any>
  }
}

interface Agent {
  id: string
  name: string
  description: string
  status: string
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

function WorkflowBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [nodeCounter, setNodeCounter] = useState(1)
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      // Mock data for now
      const mockAgents: Agent[] = [
        { id: '1', name: 'Content Creator', description: 'Creates engaging content', status: 'active' },
        { id: '2', name: 'Data Analyzer', description: 'Analyzes data patterns', status: 'active' },
        { id: '3', name: 'Email Responder', description: 'Handles email responses', status: 'inactive' },
      ]
      setAgents(mockAgents)
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      toast.error('Failed to load agents')
    }
  }

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      
      if (!draggedNodeType || !reactFlowWrapper.current) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const nodeType = draggedNodeType.split('|')[0]
      const nodeLabel = draggedNodeType.split('|')[1]
      
      const newNode: Node = {
        id: `${nodeType}-${nodeCounter}`,
        type: 'customNode',
        position,
        data: { 
          label: nodeLabel,
          nodeType: nodeType,
          config: {
            name: nodeLabel,
            description: '',
            settings: {}
          }
        } as CustomNodeData,
      }

      setNodes((nds) => nds.concat(newNode))
      setNodeCounter(nodeCounter + 1)
      setDraggedNodeType(null)
      setIsDragging(false)
    },
    [screenToFlowPosition, draggedNodeType, nodeCounter, setNodes]
  )

  const onDragStart = (event: DragEvent, nodeType: string, label: string) => {
    setDraggedNodeType(`${nodeType}|${label}`)
    setIsDragging(true)
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDragEnd = (event: DragEvent) => {
    setIsDragging(false)
  }

  const addNode = (nodeType: string, label: string) => {
    const newNode: Node = {
      id: `${nodeType}-${nodeCounter}`,
      type: 'customNode',
      position: { x: 400, y: 200 },
      data: { 
        label: label,
        nodeType: nodeType,
        config: {
          name: label,
          description: '',
          settings: {}
        }
      } as CustomNodeData,
    }
    
    setNodes((nds) => nds.concat(newNode))
    setNodeCounter(nodeCounter + 1)
  }

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config: config,
              label: config.name || node.data.label
            }
          }
        }
        return node
      })
    )
  }

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    setSelectedNodeId(null)
  }

  const clearWorkflow = () => {
    setNodes([])
    setEdges([])
    setSelectedNodeId(null)
    setNodeCounter(1)
  }

  const saveWorkflow = async () => {
    const workflowData = {
      nodes,
      edges,
      name: 'My Workflow',
      description: 'A workflow created with the builder'
    }
    
    try {
      // TODO: Save to backend
      console.log('Saving workflow:', workflowData)
      toast.success('Workflow saved successfully!')
    } catch (error) {
      console.error('Failed to save workflow:', error)
      toast.error('Failed to save workflow')
    }
  }

  const runWorkflow = async () => {
    if (nodes.length === 0) {
      toast.error('Add some nodes to your workflow first')
      return
    }

    try {
      // TODO: Execute workflow
      console.log('Running workflow with nodes:', nodes)
      toast.success('Workflow execution started!')
    } catch (error) {
      console.error('Failed to run workflow:', error)
      toast.error('Failed to run workflow')
    }
  }

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Workflow Builder</h1>
              <p className="text-sm text-gray-600">Design and configure your automation workflows</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={clearWorkflow}>
              Clear All
            </Button>
            <Button variant="outline" size="sm" onClick={saveWorkflow}>
              <IconDownload className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button size="sm" onClick={runWorkflow}>
              <IconFileAi className="h-4 w-4 mr-2" />
              Run Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Component Palette */}
        <ComponentPalette
          isCollapsed={isLeftPanelCollapsed}
          onToggleCollapse={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          onAddNode={addNode}
          onDragStart={onDragStart}
        />

        {/* Center Panel - Flow Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-50"
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            
            {/* Empty State */}
            {nodes.length === 0 && (
              <Panel position="top-center">
                <Card className="w-96 shadow-lg">
                  <CardContent className="text-center p-8">
                    <IconFileAi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Start Building Your Workflow
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag components from the left panel or click to add them to your canvas.
                      Start with a Trigger to begin your automation.
                    </p>
                  </CardContent>
                </Card>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right Panel - Node Configuration */}
        {selectedNode && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Configure Node</h3>
              <p className="text-sm text-gray-600 mt-1">
                {(selectedNode.data as CustomNodeData).label || 'Unnamed'} - {(selectedNode.data as CustomNodeData).nodeType || 'Unknown'}
              </p>
            </div>
            <div className="p-4">
              <NodeConfigurationPanel
                node={selectedNode}
                nodes={nodes}
                selectedNodeId={selectedNodeId!}
                onUpdate={(config) => updateNodeConfig(selectedNodeId!, config)}
                onDelete={() => deleteNode(selectedNodeId!)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 