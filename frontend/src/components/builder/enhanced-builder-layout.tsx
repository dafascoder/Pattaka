import React, { useMemo } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useEnhancedWorkflowBuilderStore } from '@/stores/enhanced-workflow-builder-store';
import { EnhancedWorkflowBuilder } from './enhanced-workflow-builder';
import { EnhancedPieceSelector } from './sidebar/enhanced-piece-selector';
import { FlowRunDetails } from '@/components/builder/sidebar/flow-run-details';
import { FlowVersionHistory } from '@/components/builder/sidebar/flow-version-history';
import { NodeConfigSidebar } from '@/components/builder/sidebar/node-config-sidebar';

export function EnhancedBuilderLayout() {
  const {
    leftSidebar,
    rightSidebar,
    selectedStep,
    selectedNodeId,
    nodes,
    run,
    updateNodeData,
    deleteNode,
    setRightSidebar,
  } = useEnhancedWorkflowBuilderStore();

  // Memoize sidebar visibility to prevent constant recalculation
  const showLeftSidebar = useMemo(() => leftSidebar !== 'NONE', [leftSidebar]);
  const showRightSidebar = useMemo(() => rightSidebar !== 'NONE', [rightSidebar]);

  // Memoize canvas size calculation
  const canvasDefaultSize = useMemo(() => {
    if (showLeftSidebar && showRightSidebar) return 50;
    if (showLeftSidebar || showRightSidebar) return 75;
    return 100;
  }, [showLeftSidebar, showRightSidebar]);

  // Find the selected node
  const selectedNode = useMemo(() => {
    return selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null;
  }, [selectedNodeId, nodes]);

  const renderLeftSidebar = () => {
    switch (leftSidebar) {
      case 'PIECES':
        return <EnhancedPieceSelector />;
      case 'RUNS':
        return <FlowRunDetails />;
      case 'VERSIONS':
        return <FlowVersionHistory />;
      case 'COPILOT':
        return <div className="p-4">AI Copilot (Coming soon)</div>;
      default:
        return null;
    }
  };

  const renderRightSidebar = () => {
    switch (rightSidebar) {
      case 'STEP_SETTINGS':
        return (
          <NodeConfigSidebar
            node={selectedNode}
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onUpdate={(config) => {
              if (selectedNodeId) {
                updateNodeData(selectedNodeId, {
                  displayName: config.name,
                  settings: config.settings,
                });
              }
            }}
            onDelete={() => {
              if (selectedNodeId) {
                deleteNode(selectedNodeId);
                setRightSidebar('NONE');
              }
            }}
            onClose={() => setRightSidebar('NONE')}
          />
        );
      case 'TEST_STEP':
        return <div className="p-4">Test Step (Coming soon)</div>;
      case 'RUN_DETAILS':
        return run ? <FlowRunDetails /> : null;
      default:
        return null;
    }
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Left Sidebar */}
      {showLeftSidebar && (
        <>
          <ResizablePanel
            defaultSize={25}
            minSize={20}
            maxSize={40}
            className="border-r border-border"
          >
            {renderLeftSidebar()}
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}

      {/* Canvas Area */}
      <ResizablePanel 
        defaultSize={canvasDefaultSize}
        className="relative"
      >
        <EnhancedWorkflowBuilder className="h-full" />
      </ResizablePanel>

      {/* Right Sidebar */}
      {showRightSidebar && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={25}
            minSize={20}
            maxSize={40}
            className="border-l border-border"
          >
            {renderRightSidebar()}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
} 