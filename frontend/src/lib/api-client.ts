import {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  Workflow,
  CreateWorkflowRequest,
  Integration,
  CreateIntegrationRequest,
  Execution,
  DashboardData,
  AuthContext,
  APIError,
} from '../types/api';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
      },
      credentials: 'include', // Include cookies for authentication
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: APIError = {
          message: errorData.error || errorData.message || `HTTP ${response.status}`,
          status: response.status,
          error: errorData.error,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error; // Re-throw APIError
      }
      
      // Network or other errors
      const apiError: APIError = {
        message: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
      throw apiError;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }

  // Authentication
  async getCurrentUser(): Promise<AuthContext> {
    return this.request('/me');
  }

  // Dashboard
  async getDashboardData(): Promise<DashboardData> {
    return this.request('/dashboard');
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    return this.request('/agents');
  }

  async getAgent(id: string): Promise<Agent> {
    return this.request(`/agents/${id}`);
  }

  async createAgent(agent: CreateAgentRequest): Promise<Agent> {
    return this.request('/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(id: string, agent: UpdateAgentRequest): Promise<Agent> {
    return this.request(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(id: string): Promise<void> {
    return this.request(`/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    return this.request('/workflows');
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.request(`/workflows/${id}`);
  }

  async createWorkflow(workflow: CreateWorkflowRequest): Promise<Workflow> {
    return this.request('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, workflow: Partial<CreateWorkflowRequest>): Promise<Workflow> {
    return this.request(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(id: string): Promise<void> {
    return this.request(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  // Integrations
  async getIntegrations(): Promise<Integration[]> {
    return this.request('/integrations');
  }

  async getIntegration(id: string): Promise<Integration> {
    return this.request(`/integrations/${id}`);
  }

  async createIntegration(integration: CreateIntegrationRequest): Promise<Integration> {
    return this.request('/integrations', {
      method: 'POST',
      body: JSON.stringify(integration),
    });
  }

  async updateIntegration(id: string, integration: Partial<CreateIntegrationRequest>): Promise<Integration> {
    return this.request(`/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(integration),
    });
  }

  async deleteIntegration(id: string): Promise<void> {
    return this.request(`/integrations/${id}`, {
      method: 'DELETE',
    });
  }

  // Executions
  async getExecutions(): Promise<Execution[]> {
    return this.request('/executions');
  }

  async getExecution(id: string): Promise<Execution> {
    return this.request(`/executions/${id}`);
  }

  async getExecutionsByWorkflow(workflowId: string): Promise<Execution[]> {
    return this.request(`/executions?workflow_id=${workflowId}`);
  }

  async getExecutionsByAgent(agentId: string): Promise<Execution[]> {
    return this.request(`/executions?agent_id=${agentId}`);
  }
}

// Create and export a singleton instance
export const apiClient = new APIClient('http://localhost:8080/api');
export default apiClient; 