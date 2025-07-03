import React from 'react';
import { IconAlertTriangle, IconX } from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEnhancedWorkflowBuilderStore } from '@/stores/enhanced-workflow-builder-store';

interface FlowValidationOverlayProps {
  errors: Record<string, string>;
}

export function FlowValidationOverlay({ errors }: FlowValidationOverlayProps) {
  const { selectStepByName } = useEnhancedWorkflowBuilderStore();
  
  const errorCount = Object.keys(errors).length;
  
  if (errorCount === 0) return null;

  return (
    <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
      <Alert className="pointer-events-auto border-yellow-200 bg-yellow-50">
        <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-800">
              {errorCount} validation {errorCount === 1 ? 'error' : 'errors'} found
            </span>
            <Badge variant="outline" className="text-yellow-700 border-yellow-300">
              {errorCount}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(errors).slice(0, 2).map(([stepName, error]) => (
              <Button
                key={stepName}
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => selectStepByName(stepName)}
              >
                Fix {stepName}
              </Button>
            ))}
            {errorCount > 2 && (
              <span className="text-xs text-yellow-600">
                +{errorCount - 2} more
              </span>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
} 