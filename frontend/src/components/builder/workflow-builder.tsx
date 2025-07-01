import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowProvider,
  ReactFlowInstance,
  Connection,
  EdgeChange,
  NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './node-types';
import { IconBolt, IconMouse } from '@tabler/icons-react';

const initialEdges: Edge[] = [];

interface WorkflowBuilderProps {
  nodes?: Node[];
  edges?: Edge[];
  selectedNodeId?: string | null;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onNodeSelection?: (node: Node | null) => void;
}

function WorkflowBuilderContent({ 
  nodes: externalNodes,
  edges: externalEdges,
  selectedNodeId: externalSelectedNodeId,
  onNodesChange: externalOnNodesChange,
  onEdgesChange: externalOnEdgesChange,
  onNodeSelection 
}: WorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [internalNodes, setInternalNodes] = useState<Node[]>([]);
  const [internalEdges, setInternalEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Use external props if provided, otherwise use internal state
  const nodes = externalNodes ?? internalNodes;
  const edges = externalEdges ?? internalEdges;
  
  // Check if there's already a trigger node
  const hasTrigger = nodes?.some(node => node.data.nodeType === 'trigger');

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const selectionChange = changes.find(c => c.type === 'select');
      if (selectionChange && selectionChange.type === 'select') {
        const selectedNode = selectionChange.selected 
          ? nodes?.find(node => node.id === selectionChange.id) || null
          : null;
        onNodeSelection?.(selectedNode);
      }
      
      const updatedNodes = applyNodeChanges(changes, nodes ?? []);
      
      if (externalOnNodesChange) {
        externalOnNodesChange(updatedNodes);
      } else {
        setInternalNodes(updatedNodes);
      }
    },
    [nodes, onNodeSelection, externalOnNodesChange]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges ?? []);
      
      if (externalOnEdgesChange) {
        externalOnEdgesChange(updatedEdges);
      } else {
        setInternalEdges(updatedEdges);
      }
    },
    [edges, externalOnEdgesChange]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const updatedEdges = addEdge(connection, edges ?? []);
      
      if (externalOnEdgesChange) {
        externalOnEdgesChange(updatedEdges);
      } else {
        setInternalEdges(updatedEdges);
      }
    },
    [edges, externalOnEdgesChange]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }
      
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode: Node = {
        id: `${type}-${+new Date()}`,
        type: 'customNode',
        position,
        data: { label: `${label}`, nodeType: type },
      };

      const updatedNodes = nodes?.concat(newNode) ?? [newNode];
      
      if (externalOnNodesChange) {
        externalOnNodesChange(updatedNodes);
      } else {
        setInternalNodes(updatedNodes);
      }
    },
    [reactFlowInstance, nodes, externalOnNodesChange]
  );

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>

      {nodes?.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center h-full text-center p-8 pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6 border border-border">
            <IconBolt size={40} className="text-muted-foreground/70" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Build Your Workflow</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Your canvas is empty. Start by dragging a component from the palette on the left.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground/80 p-2 rounded-lg bg-muted border border-border">
            <IconMouse size={20} />
            <span>Drag and drop to begin</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkflowBuilder(props: WorkflowBuilderProps = {}) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent {...props} />
    </ReactFlowProvider>
  );
} 