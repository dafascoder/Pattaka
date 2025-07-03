import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { 
  IconAlertTriangle, 
  IconCheck, 
  IconEye, 
  IconEyeOff, 
  IconLoader2,
  IconPlayerPlay,
  IconX,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  useEnhancedWorkflowBuilderStore,
  type FlowStep,
  type FlowStepRun,
} from '@/stores/enhanced-workflow-builder-store';
import { getStepIcon, getStepColor } from '@/components/builder/nodes/step-utils';

interface EnhancedStepNodeData {
  stepName: string;
  stepType: 'trigger' | 'action' | 'branch';
  displayName: string;
  settings?: Record<string, any>;
  valid?: boolean;
  errors?: string[];
}

export const EnhancedStepNode = memo(({ data, selected, id }: NodeProps & { data: EnhancedStepNodeData }) => {
  const { 
    readonly, 
    run,
    applyOperation,
  } = useEnhancedWorkflowBuilderStore();

  // Create a step object from the flattened data structure
  const step: FlowStep = {
    name: data.stepName,
    type: data.stepType === 'trigger' ? 'TRIGGER' : 'ACTION',
    displayName: data.displayName,
    settings: data.settings || {},
    valid: data.valid,
    errors: data.errors,
  };

  const isValid = data.valid ?? true;
  // Note: stepRun and sampleData would need to be passed separately or fetched from store
  const stepRun: FlowStepRun | undefined = undefined; // TODO: Get from store based on current run
  const sampleData: unknown = undefined; // TODO: Get from store
  
  const isRunning = false; // stepRun?.status === 'RUNNING';
  const hasError = !isValid; // stepRun?.status === 'FAILED' || !isValid;
  const isSuccess = false; // stepRun?.status === 'SUCCEEDED';
  const isSkipped = false; // stepRun?.status === 'SKIPPED';
  const isViewingRun = !!run;

  const StepIcon = getStepIcon(step.type, step.settings?.pieceType);
  const stepColor = getStepColor(step.type, step.settings?.pieceType);

  const handleTestStep = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Also prevent default behavior
    
    if (readonly) return;
    
    // TODO: Implement test step functionality
    console.log('Test step:', step.name);
  };

  const handleSkipToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readonly) return;
    
    applyOperation({
      type: 'SKIP_ACTION',
      request: {
        stepName: step.name,
        skip: !step.settings?.skip,
      },
    });
  };

  const getStatusIcon = () => {
    if (isRunning) return <IconLoader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (hasError) return <IconX className="h-4 w-4 text-red-500" />;
    if (isSuccess) return <IconCheck className="h-4 w-4 text-green-500" />;
    if (isSkipped) return <IconEyeOff className="h-4 w-4 text-gray-400" />;
    if (!isValid) return <IconAlertTriangle className="h-4 w-4 text-yellow-500" />;
    return null;
  };

  const getNodeClasses = () => {
    return cn(
      'relative rounded-lg border-2 bg-white shadow-sm transition-all duration-200 cursor-pointer group',
      'min-w-[200px] max-w-[280px]',
      // Selection state
      selected ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300',
      // Status-based styling
      hasError && 'border-red-300 bg-red-50',
      isSuccess && 'border-green-300 bg-green-50',
      isSkipped && 'border-gray-300 bg-gray-50 opacity-60',
      // Readonly state
      readonly && 'cursor-default',
      // Hover effects
      !readonly && 'hover:shadow-md',
    );
  };

  const showConnectionPoints = step.type !== 'TRIGGER' || Object.keys(step.settings || {}).length > 0;

  return (
    <div className={getNodeClasses()}>
      {/* Input Handle - hide for triggers */}
      {step.type !== 'TRIGGER' && showConnectionPoints && (
        <Handle
          type="target"
          position={Position.Top}
          className={cn(
            '!h-3 !w-3 !border-2 !border-white',
            hasError ? '!bg-red-400' : '!bg-gray-400',
            '!-translate-y-1/2'
          )}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={cn('rounded-md p-1.5', stepColor)}>
            <StepIcon className="h-4 w-4" />
          </div>
          <div className="font-medium text-sm text-gray-900 truncate max-w-[120px]">
            {step.displayName}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          {!readonly && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleTestStep}
                title="Test step"
              >
                <IconPlayerPlay className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleSkipToggle}
                title={step.settings?.skip ? "Enable step" : "Skip step"}
              >
                {step.settings?.skip ? <IconEyeOff className="h-3 w-3" /> : <IconEye className="h-3 w-3" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-3">
        {/* Step type badge */}
        <div className="flex items-center gap-2 mb-2">
          <Badge 
            variant={step.type === 'TRIGGER' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {step.type.toLowerCase()}
          </Badge>
          
          {step.settings?.pieceType && (
            <Badge variant="outline" className="text-xs">
              {step.settings.pieceType}
            </Badge>
          )}
          
          {step.settings?.skip && (
            <Badge variant="destructive" className="text-xs">
              Skipped
            </Badge>
          )}
        </div>

        {/* Description or settings preview */}
        <div className="text-xs text-gray-500 line-clamp-2">
          {getStepDescription(step)}
        </div>

        {/* Execution info during runs */}
        {/* TODO: Re-enable when stepRun is properly implemented
        {isViewingRun && stepRun && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                {stepRun.duration ? `${stepRun.duration}ms` : '—'}
              </span>
              <span className={cn(
                'font-medium',
                isSuccess && 'text-green-600',
                hasError && 'text-red-600',
                isRunning && 'text-blue-600',
                isSkipped && 'text-gray-400'
              )}>
                {stepRun.status.toLowerCase()}
              </span>
            </div>
          </div>
        )}
        */}

        {/* Validation errors */}
        {!isValid && step.errors && step.errors.length > 0 && (
          <div className="mt-2 p-2 rounded bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-2">
              <IconAlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-yellow-800">{step.errors.join(', ')}</span>
            </div>
          </div>
        )}

        {/* Sample data indicator */}
        {/* TODO: Re-enable when sampleData is properly implemented
        {sampleData && !isViewingRun && (
          <div className="mt-2 flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-xs text-gray-500">Sample data available</span>
          </div>
        )}
        */}
      </div>

      {/* Output Handle */}
      {showConnectionPoints && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={cn(
            '!h-3 !w-3 !border-2 !border-white',
            hasError ? '!bg-red-400' : '!bg-gray-400',
            '!translate-y-1/2'
          )}
        />
      )}

      {/* Loading overlay for testing */}
      {isRunning && !isViewingRun && (
        <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <IconLoader2 className="h-4 w-4 animate-spin" />
            Testing...
          </div>
        </div>
      )}
    </div>
  );
});

EnhancedStepNode.displayName = 'EnhancedStepNode';

// Helper function to get step description
function getStepDescription(step: FlowStep): string {
  switch (step.type) {
    case 'TRIGGER':
      if (step.settings?.triggerType === 'webhook') {
        return `Webhook trigger: ${step.settings?.path || '/webhook'}`;
      }
      if (step.settings?.triggerType === 'schedule') {
        return `Scheduled: ${step.settings?.cronExpression || 'Manual'}`;
      }
      return 'Manual trigger';
      
    case 'ACTION':
      if (step.settings?.pieceType === 'http') {
        return `${step.settings?.method || 'GET'} ${step.settings?.url || 'Configure URL'}`;
      }
      if (step.settings?.pieceType === 'email') {
        return `Send email to: ${step.settings?.to || 'Configure recipient'}`;
      }
      if (step.settings?.pieceType === 'code') {
        return 'Custom code execution';
      }
      return step.settings?.pieceType || 'Configure action';
      
    case 'LOOP':
      return `Loop over: ${step.settings?.items || 'Configure items'}`;
      
    case 'ROUTER':
      return `Branch on: ${step.settings?.conditions?.length || 0} condition(s)`;
      
    case 'CODE':
      return 'Custom TypeScript/JavaScript code';
      
    default:
      return 'Configure step';
  }
} 