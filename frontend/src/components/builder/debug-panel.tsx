import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  IconBug, 
  IconX, 
  IconDownload, 
  IconTrash,
  IconLoader2,
  IconCheck,
  IconAlertTriangle,
  IconClock,
  IconWifi,
  IconWifiOff,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { FlowRun } from '@/types/api';
import { getWebSocketService, type ExecutionEvent, type ExecutionEventHandler } from '@/services/websocket-service';
import { useEnhancedWorkflowBuilderStore } from '@/stores/enhanced-workflow-builder-store';

interface DebugLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning' | 'debug';
  message: string;
  data?: Record<string, unknown>;
  stepName?: string;
  duration?: number;
}

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  execution?: FlowRun | null;
  projectId?: string;
}

export function DebugPanel({ isOpen, onClose, execution, projectId }: DebugPanelProps) {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('DISCONNECTED');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const wsService = getWebSocketService();
  
  // Get setRun from store to update execution status
  const { setRun } = useEnhancedWorkflowBuilderStore();

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  // WebSocket event handler
  const handleExecutionEvent: ExecutionEventHandler = useCallback((event: ExecutionEvent) => {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    
    let log: DebugLog;
    
    switch (event.type) {
      case 'connection_established':
        log = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp,
          level: 'info',
          message: 'WebSocket connection established',
          data: { connectionId: event.flowRunId },
        };
        break;
        
      case 'flow_started':
        log = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp,
          level: 'info',
          message: `Flow "${event.data?.flowName || 'Unknown'}" started`,
          data: event.data,
        };
        break;
        
      case 'step_started':
        log = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp,
          level: 'info',
          message: `Step "${event.stepName}" started`,
          stepName: event.stepName,
          data: event.data,
        };
        break;
        
      case 'step_completed':
        log = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp,
          level: 'success',
          message: `Step "${event.stepName}" completed (${event.status})`,
          stepName: event.stepName,
          duration: event.duration,
          data: event.data,
        };
        break;
        
      case 'step_error':
        log = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp,
          level: 'error',
          message: `Step "${event.stepName}" failed: ${event.error}`,
          stepName: event.stepName,
          duration: event.duration,
          data: event.data,
        };
        
        // Update the run status to FAILED when a step fails
        if (execution) {
          const updatedRun: FlowRun = {
            ...execution,
            status: 'FAILED',
            finishTime: event.timestamp,
          };
          setRun(updatedRun);
        }
        break;
        
      case 'flow_completed':
        log = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp,
          level: event.status === 'SUCCEEDED' ? 'success' : 'error',
          message: `Flow completed with status: ${event.status}${event.error ? ` - ${event.error}` : ''}`,
          duration: event.duration,
          data: event.data,
        };
        
        // Update the run status in the store when flow completes
        if (execution) {
          const updatedRun: FlowRun = {
            ...execution,
            status: event.status as FlowRun['status'],
            finishTime: event.timestamp,
          };
          setRun(updatedRun);
        }
        break;
        
      default:
        log = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp,
          level: 'debug',
          message: `Unknown event: ${event.type}`,
          data: event as unknown as Record<string, unknown>,
        };
    }
    
    setLogs(prev => [...prev, log]);
  }, []);

  // Connect to WebSocket when debug panel opens or execution changes
  useEffect(() => {
    if (!isOpen) {
      // Disconnect when panel closes
      wsService.removeEventHandler(handleExecutionEvent);
      wsService.disconnect();
      setConnectionStatus('DISCONNECTED');
      return;
    }

    // Add event handler immediately when panel opens
    wsService.addEventHandler(handleExecutionEvent);
    
    // Monitor connection status
    const statusInterval = setInterval(() => {
      setConnectionStatus(wsService.getConnectionState());
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      wsService.removeEventHandler(handleExecutionEvent);
    };
  }, [isOpen, handleExecutionEvent]);

  // Connect to WebSocket when execution ID becomes available
  useEffect(() => {
    if (!isOpen || !execution?.id) {
      return;
    }

    const flowRunId = execution.id;
    
    console.log('Debug Panel: Connecting to WebSocket for execution:', flowRunId);
    
    // Connect to WebSocket for this specific execution
    wsService.connect(flowRunId, projectId)
      .then(() => {
        setConnectionStatus('CONNECTED');
        console.log('Debug Panel: Connected to WebSocket for execution:', flowRunId);
      })
      .catch((error) => {
        console.error('Debug Panel: Failed to connect to WebSocket:', error);
        setConnectionStatus('DISCONNECTED');
      });

    return () => {
      // Don't disconnect here - let the main effect handle it
      console.log('Debug Panel: Execution changed, will reconnect if needed');
    };
  }, [execution?.id, projectId, isOpen]);

  // Clear logs when execution changes
  useEffect(() => {
    if (execution?.id) {
      setLogs([]);
    }
  }, [execution?.id]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logData = logs.map(log => ({
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
      stepName: log.stepName,
      duration: log.duration,
      data: log.data,
    }));
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-execution-logs-${execution?.id || 'unknown'}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success': return <IconCheck className="h-4 w-4 text-green-500" />;
      case 'error': return <IconX className="h-4 w-4 text-red-500" />;
      case 'warning': return <IconAlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'debug': return <IconBug className="h-4 w-4 text-gray-500" />;
      default: return <IconClock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'debug': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const ConnectionIndicator = () => (
    <div className="flex items-center gap-2">
      {connectionStatus === 'CONNECTED' ? (
        <IconWifi className="h-4 w-4 text-green-500" />
      ) : (
        <IconWifiOff className="h-4 w-4 text-red-500" />
      )}
      <span className="text-sm text-muted-foreground">
        {connectionStatus}
      </span>
    </div>
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBug className="h-5 w-5" />
              <SheetTitle className="text-base">Debug Panel</SheetTitle>
              <Badge variant="outline" className="text-xs">
                {filteredLogs.length} logs
              </Badge>
            </div>
            <ConnectionIndicator />
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1">
                <Switch
                  id="auto-scroll"
                  checked={autoScroll}
                  onCheckedChange={setAutoScroll}
                  className="scale-75"
                />
                <Label htmlFor="auto-scroll" className="text-xs">Auto</Label>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={exportLogs} disabled={logs.length === 0}>
                <IconDownload className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={clearLogs} disabled={logs.length === 0}>
                <IconTrash className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        <Separator />
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-12rem)] p-3" ref={scrollAreaRef}>
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <IconLoader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Waiting for execution events...</p>
                  {execution?.id && (
                    <p className="text-xs mt-1">Flow Run: {execution.id}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-md border text-xs ${getLogColor(log.level)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getLogIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            {log.timestamp}
                          </span>
                          {log.stepName && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              {log.stepName}
                            </Badge>
                          )}
                          {log.duration && (
                            <span className="text-xs text-muted-foreground">
                              {log.duration}ms
                            </span>
                          )}
                        </div>
                        <p className="break-words">{log.message}</p>
                        {log.data && Object.keys(log.data).length > 0 && (
                          <details className="mt-1">
                            <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              View data
                            </summary>
                            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-20">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
} 