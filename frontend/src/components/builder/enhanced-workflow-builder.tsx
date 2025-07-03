import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  type ReactFlowInstance,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useEnhancedWorkflowBuilderStore, type FlowStep } from '@/stores/enhanced-workflow-builder-store';
import { EnhancedStepNode } from '@/components/builder/nodes/enhanced-step-node';
import { FlowContextMenu } from '@/components/builder/context-menu/flow-context-menu';
import { FlowKeyboardShortcuts } from '@/components/builder/keyboard-shortcuts';
import { FlowValidationOverlay } from '@/components/builder/validation-overlay';
import { FlowExecutionOverlay } from '@/components/builder/execution-overlay';
import { BuilderEmptyState } from './builder-empty-state';
import { BuilderLoading } from './builder-loading';

const nodeTypes = {
  step: EnhancedStepNode,
};

const edgeOptions = {
  animated: false,
  style: {
    stroke: '#94a3b8',
    strokeWidth: 2,
  },
};

interface EnhancedWorkflowBuilderProps {
  className?: string;
  onFlowChange?: (nodes: Node[], edges: Edge[]) => void;
}

function EnhancedWorkflowBuilderContent({ 
  className, 
  onFlowChange 
}: EnhancedWorkflowBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    type: 'canvas' | 'node';
    nodeId?: string;
  }>({ show: false, x: 0, y: 0, type: 'canvas' });

  // Get state and actions from store
  const {
    nodes,
    edges,
    flowVersion,
    selectedStep,
    readonly,
    saving,
    run,
    sampleData,
    isValid,
    onNodesChange: storeOnNodesChange,
    onEdgesChange: storeOnEdgesChange,
    onConnect: storeOnConnect,
    selectNode,
    applyOperation,
    validateFlow,
    getStepErrors,
  } = useEnhancedWorkflowBuilderStore();

  // Handle node selection changes
  const handleNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    // Update store with node changes first
    storeOnNodesChange(changes);
    
    // Handle selection changes by updating our store's selection state
    const selectionChange = changes.find(change => change.type === 'select');
    if (selectionChange && selectionChange.type === 'select') {
      const selectedNodeId = selectionChange.selected ? selectionChange.id : null;
      
      // Get the updated nodes after applying changes
      const { nodes: currentNodes } = useEnhancedWorkflowBuilderStore.getState();
      const selectedNode = selectedNodeId ? currentNodes.find(n => n.id === selectedNodeId) : null;
      const selectedStep = selectedNode ? {
        name: selectedNode.data.stepName,
        type: (selectedNode.data.stepType === 'trigger' ? 'TRIGGER' : 'ACTION') as 'TRIGGER' | 'ACTION',
        displayName: selectedNode.data.displayName,
        settings: selectedNode.data.settings || {},
        valid: selectedNode.data.valid,
        errors: selectedNode.data.errors,
      } : null;
      
      // Update only the selection state, not the nodes (ReactFlow already handled that)
      useEnhancedWorkflowBuilderStore.setState({
        selectedNodeId,
        selectedStep,
        rightSidebar: selectedNodeId ? 'STEP_SETTINGS' : 'NONE'
      });
    }
    
    // Notify parent of changes
    onFlowChange?.(nodes, edges);
  }, [storeOnNodesChange, nodes, edges, onFlowChange]);

  // Handle edge changes
  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    storeOnEdgesChange(changes);
    onFlowChange?.(nodes, edges);
  }, [storeOnEdgesChange, nodes, edges, onFlowChange]);

  // Handle connections
  const handleConnect: OnConnect = useCallback((connection: Connection) => {
    if (readonly) return;
    storeOnConnect(connection);
    onFlowChange?.(nodes, edges);
  }, [readonly, storeOnConnect, nodes, edges, onFlowChange]);

  // Context menu handlers
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      type: 'node',
      nodeId: node.id,
    });
  }, []);

  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      type: 'canvas',
    });
  }, []);

  const onPaneClick = useCallback(() => {
    // Clear selection when clicking on canvas
    useEnhancedWorkflowBuilderStore.setState({
      selectedNodeId: null,
      selectedStep: null,
      rightSidebar: 'NONE'
    });
  }, []);

  // Drag and drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    if (!reactFlowInstance || readonly) return;

    const type = event.dataTransfer.getData('application/reactflow');
    const label = event.dataTransfer.getData('application/reactflow-label');
    const category = event.dataTransfer.getData('application/reactflow-category');
    const itemType = event.dataTransfer.getData('application/reactflow-type');
    
    if (!type) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Handle triggers vs actions differently
    if (category === 'triggers' || itemType === 'trigger') {
      // Apply operation to add/update trigger
      applyOperation({
        type: 'UPDATE_TRIGGER',
        request: {
          stepName: 'trigger',
          displayName: label,
          type: 'TRIGGER',
          position,
          settings: {
            pieceType: type,
          },
        },
      });
    } else {
      // Apply operation to add new action step
      applyOperation({
        type: 'ADD_ACTION',
        request: {
          stepName: `${type}_${Date.now()}`,
          displayName: label,
          type: 'ACTION',
          position,
          settings: {
            pieceType: type,
          },
        },
      });
    }
  }, [reactFlowInstance, readonly, applyOperation]);

  if (nodes.length === 0) {
    return <BuilderLoading />;
  }

  return (
    <div className={`relative h-full w-full ${className || ''}`} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onInit={setReactFlowInstance}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="bg-background"
        defaultEdgeOptions={edgeOptions}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap 
          className="!bg-background !border-border" 
          nodeColor="#8b5cf6"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu.show && (
        <FlowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(prev => ({ ...prev, show: false }))}
          type={contextMenu.type}
          nodeId={contextMenu.nodeId}
        />
      )}

      {/* Keyboard Shortcuts */}
      <FlowKeyboardShortcuts />

      {/* Validation Overlay */}
      {!isValid && selectedStep && (
        <FlowValidationOverlay errors={{ [selectedStep.name]: getStepErrors(selectedStep.name).join(', ') }} />
      )}

      {/* Execution Overlay */}
      {run && sampleData && (
        <FlowExecutionOverlay run={run} sampleData={sampleData} />
      )}

      {/* Saving indicator */}
      {saving && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
            Saving...
          </div>
        </div>
      )}
    </div>
  );
}

export function EnhancedWorkflowBuilder(props: EnhancedWorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <EnhancedWorkflowBuilderContent {...props} />
    </ReactFlowProvider>
  );
} 