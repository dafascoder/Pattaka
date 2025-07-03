import React from 'react';
import { 
  IconLoader2, 
  IconCheck, 
  IconX, 
  IconClock,
  IconPlaystationX,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  useEnhancedWorkflowBuilderStore,
} from '@/stores/enhanced-workflow-builder-store';
import type { FlowRun } from '@/types/api';

interface FlowExecutionOverlayProps {
  run: FlowRun;
  sampleData: Record<string, unknown>;
}

export function FlowExecutionOverlay({ run, sampleData }: FlowExecutionOverlayProps) {
  const { setExecutionOverlayOpen } = useEnhancedWorkflowBuilderStore();
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <IconLoader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'SUCCEEDED':
        return <IconCheck className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <IconX className="h-4 w-4 text-red-500" />;
      case 'PAUSED':
        return <IconClock className="h-4 w-4 text-yellow-500" />;
      case 'CANCELLED':
        return <IconPlaystationX className="h-4 w-4 text-gray-500" />;
      default:
        return <IconClock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'SUCCEEDED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'FAILED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'PAUSED':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'CANCELLED':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      <div className={`rounded-lg border p-4 shadow-sm ${getStatusColor(run.status)}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(run.status)}
            <span className="font-medium">
              Workflow {run.status.toLowerCase()}
            </span>
            <Badge variant="outline" className="text-xs">
              Run #{run.id.slice(-8)}
            </Badge>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExecutionOverlayOpen(false)}
            className="h-8"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div>
            Started: {new Date(run.startTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })}
          </div>
          {run.finishTime && (
            <div>
              Duration: {Math.round(
                (new Date(run.finishTime).getTime() - new Date(run.startTime).getTime()) / 1000
              )}s
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 