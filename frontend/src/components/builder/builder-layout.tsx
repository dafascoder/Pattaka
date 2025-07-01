import { useState } from "react"
import { Node, Edge } from "@xyflow/react"
import { BuilderSidebar } from "./sidebar/builder-sidebar"
import { SidebarInset, SidebarProvider } from "../ui/sidebar"
import { Outlet } from "@tanstack/react-router"
import { BuilderHeader } from "./builder-header"
import { NodeConfigSidebar } from "./sidebar/node-config-sidebar"
import { WorkflowBuilder } from "./workflow-builder"

interface BuilderLayoutProps {
  // Optional props that can be passed from parent components
  selectedNode?: Node | null
  nodes?: Node[]
  edges?: Edge[]
  onNodeUpdate?: (nodeId: string, config: any) => void
  onNodeDelete?: (nodeId: string) => void
  onNodesChange?: (nodes: Node[]) => void
  onEdgesChange?: (edges: Edge[]) => void
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'customNode',
    data: { label: 'Start', nodeType: 'trigger' },
    position: { x: 250, y: 5 },
  },
  {
    id: '2',
    type: 'customNode',
    data: { label: 'Agent', nodeType: 'agent' },
    position: { x: 250, y: 200 },
  }
];

const initialEdges: Edge[] = [];

export function BuilderLayout({ 
  selectedNode: externalSelectedNode,
  nodes: externalNodes,
  edges: externalEdges,
  onNodeUpdate: externalOnNodeUpdate,
  onNodeDelete: externalOnNodeDelete,
  onNodesChange: externalOnNodesChange,
  onEdgesChange: externalOnEdgesChange
}: BuilderLayoutProps = {}) {
  // Internal state for node selection, nodes, and edges if not provided externally
  const [internalSelectedNode, setInternalSelectedNode] = useState<Node | null>(null)
  const [internalNodes, setInternalNodes] = useState<Node[]>(initialNodes)
  const [internalEdges, setInternalEdges] = useState<Edge[]>(initialEdges)

  // Use external props if provided, otherwise use internal state
  const selectedNode = externalSelectedNode ?? internalSelectedNode
  const nodes = externalNodes ?? internalNodes
  const edges = externalEdges ?? internalEdges
  
  const handleNodeSelection = (node: Node | null) => {
    if (!externalSelectedNode) {
      setInternalSelectedNode(node)
    }
  }

  const handleNodesChange = (updatedNodes: Node[]) => {
    if (externalOnNodesChange) {
      externalOnNodesChange(updatedNodes)
    } else {
      setInternalNodes(updatedNodes)
    }
  }

  const handleEdgesChange = (updatedEdges: Edge[]) => {
    if (externalOnEdgesChange) {
      externalOnEdgesChange(updatedEdges)
    } else {
      setInternalEdges(updatedEdges)
    }
  }
  
  const handleNodeUpdate = (config: any) => {
    if (selectedNode) {
      if (externalOnNodeUpdate) {
        externalOnNodeUpdate(selectedNode.id, config)
      } else {
        // Internal update logic if no external handler provided
        const updatedNodes = nodes.map(node => 
          node.id === selectedNode.id 
            ? { ...node, data: { ...node.data, config } }
            : node
        )
        setInternalNodes(updatedNodes)
        
        // Update the selected node with new config
        const updatedSelectedNode = updatedNodes.find(node => node.id === selectedNode.id)
        if (updatedSelectedNode) {
          setInternalSelectedNode(updatedSelectedNode)
        }
      }
    }
  }

  const handleNodeDelete = () => {
    if (selectedNode) {
      if (externalOnNodeDelete) {
        externalOnNodeDelete(selectedNode.id)
      } else {
        // Internal delete logic if no external handler provided
        const updatedNodes = nodes.filter(node => node.id !== selectedNode.id)
        setInternalNodes(updatedNodes)
        setInternalSelectedNode(null)
      }
    }
  }

  const handleCloseConfig = () => {
    if (!externalSelectedNode) {
      setInternalSelectedNode(null)
    }
  }

  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <BuilderSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <BuilderHeader workflowName="Workflow Builder" />
          <div className="flex-1">
            <WorkflowBuilder 
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNode?.id || null}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onNodeSelection={handleNodeSelection}
            />
          </div>
        </SidebarInset>
        
        {/* Always render NodeConfigSidebar */}
        <NodeConfigSidebar 
          node={selectedNode}
          nodes={nodes}
          selectedNodeId={selectedNode?.id || null}
          onUpdate={handleNodeUpdate}
          onDelete={handleNodeDelete}
          onClose={handleCloseConfig}
        />
      </SidebarProvider>
    </div>
  )
}