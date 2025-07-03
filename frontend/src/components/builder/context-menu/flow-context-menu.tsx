import React from 'react';
import { 
  IconCopy, 
  IconTrash, 
  IconPlus, 
  IconEye, 
  IconEyeOff,
  IconPaperclip,
  IconSettings,
} from '@tabler/icons-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { useEnhancedWorkflowBuilderStore } from '@/stores/enhanced-workflow-builder-store';

interface FlowContextMenuProps {
  x: number;
  y: number;
  type: 'canvas' | 'node';
  nodeId?: string;
  onClose: () => void;
}

export function FlowContextMenu({ x, y, type, nodeId, onClose }: FlowContextMenuProps) {
  const { 
    flowVersion,
    readonly,
    applyOperation,
    selectStepByName,
  } = useEnhancedWorkflowBuilderStore();

  const step = nodeId && flowVersion ? 
    (flowVersion.trigger?.name === nodeId ? flowVersion.trigger : flowVersion.steps[nodeId]) : 
    null;

  const handleAction = async (action: string) => {
    onClose();
    
    if (readonly) return;

    try {
      switch (action) {
        case 'add-step':
          // This would typically open a piece selector
          break;
          
        case 'duplicate':
          if (nodeId) {
            await applyOperation({
              type: 'DUPLICATE_ACTION',
              request: { stepName: nodeId },
            });
          }
          break;
          
        case 'delete':
          if (nodeId) {
            await applyOperation({
              type: 'DELETE_ACTION',
              request: { stepName: nodeId },
            });
          }
          break;
          
        case 'skip':
          if (nodeId && step) {
            await applyOperation({
              type: 'SKIP_ACTION',
              request: {
                stepName: nodeId,
                skip: !step.settings?.skip,
              },
            });
          }
          break;
          
        case 'configure':
          if (nodeId) {
            selectStepByName(nodeId);
          }
          break;
      }
    } catch (error) {
      console.error('Context menu action failed:', error);
    }
  };

  return (
    <div
      className="fixed z-50"
      style={{
        left: x,
        top: y,
      }}
    >
      <ContextMenuContent className="w-56">
        {type === 'canvas' && (
          <>
            <ContextMenuItem onClick={() => handleAction('add-step')}>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Step
            </ContextMenuItem>
          </>
        )}
        
        {type === 'node' && nodeId && step && (
          <>
            <ContextMenuItem onClick={() => handleAction('configure')}>
              <IconSettings className="mr-2 h-4 w-4" />
              Configure
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={() => handleAction('duplicate')}>
              <IconPaperclip className="mr-2 h-4 w-4" />
              Duplicate
            </ContextMenuItem>
            
            <ContextMenuItem onClick={() => handleAction('skip')}>
              {step.settings?.skip ? (
                <IconEye className="mr-2 h-4 w-4" />
              ) : (
                <IconEyeOff className="mr-2 h-4 w-4" />
              )}
              {step.settings?.skip ? 'Enable' : 'Skip'} Step
            </ContextMenuItem>
            
            <ContextMenuSeparator />
            
            {step.type !== 'TRIGGER' && (
              <ContextMenuItem 
                onClick={() => handleAction('delete')}
                className="text-red-600 focus:text-red-600"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete
              </ContextMenuItem>
            )}
          </>
        )}
      </ContextMenuContent>
    </div>
  );
} 