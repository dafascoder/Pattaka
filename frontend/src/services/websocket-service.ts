export interface ExecutionEvent {
  type: string;
  timestamp: string;
  flowRunId: string;
  stepName?: string;
  status?: string;
  data?: Record<string, unknown>;
  error?: string;
  duration?: number;
}

export type ExecutionEventHandler = (event: ExecutionEvent) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private pingInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Set<ExecutionEventHandler> = new Set();
  private flowRunId: string | null = null;
  private projectId: string | null = null;

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    this.sendPing = this.sendPing.bind(this);
  }

  connect(flowRunId: string, projectId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.flowRunId = flowRunId;
      this.projectId = projectId || '';

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = process.env.NODE_ENV === 'development' ? '8080' : window.location.port;
      
      // Get auth token from localStorage or cookies
      const token = localStorage.getItem('token') || 
                   document.cookie
                     .split('; ')
                     .find(row => row.startsWith('token='))
                     ?.split('=')[1];
      
      let url = `${protocol}//${host}:${port}/ws/execution?flowRunId=${flowRunId}&projectId=${this.projectId}`;
      if (token) {
        url += `&token=${token}`;
      }

      console.log('Connecting to WebSocket:', url);

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.handleOpen();
        resolve();
      };

      this.ws.onmessage = this.handleMessage;
      this.ws.onclose = this.handleClose;
      this.ws.onerror = (error) => {
        this.handleError(error);
        reject(new Error('WebSocket connection failed'));
      };

      // Timeout for connection
      setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    });
  }

  disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.flowRunId = null;
    this.projectId = null;
  }

  addEventHandler(handler: ExecutionEventHandler): void {
    this.eventHandlers.add(handler);
  }

  removeEventHandler(handler: ExecutionEventHandler): void {
    this.eventHandlers.delete(handler);
  }

  private handleOpen(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    // Start ping interval
    this.pingInterval = setInterval(this.sendPing, 30000); // Ping every 30 seconds
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as ExecutionEvent;
      
      // Handle pong responses
      if (data.type === 'pong') {
        return;
      }

      console.log('WebSocket message received:', data);

      // Broadcast to all handlers
      this.eventHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Attempt to reconnect if it wasn't a normal closure
    if (event.code !== 1000 && this.flowRunId && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.flowRunId) {
          this.connect(this.flowRunId, this.projectId || undefined).catch(error => {
            console.error('Reconnection failed:', error);
          });
        }
      }, this.reconnectDelay);

      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
  }

  private sendPing(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send('ping');
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'CONNECTED';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'DISCONNECTED';
      default: return 'UNKNOWN';
    }
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (!wsService) {
    wsService = new WebSocketService();
  }
  return wsService;
} 