# API Client and React Query Integration

This directory contains the API client and React Query hooks for interacting with the Voltig backend API.

## Files Overview

- `api-client.ts` - Core API client class with all HTTP methods
- `react-query.ts` - React Query hooks for all API endpoints
- `types/api.ts` - TypeScript types for API requests and responses

## API Client (`api-client.ts`)

The API client provides a clean interface for making HTTP requests to the backend. It includes:

- **Authentication**: Automatic cookie handling for Better Auth sessions
- **Error Handling**: Consistent error formatting and handling
- **Type Safety**: Full TypeScript support for requests and responses

### Usage

```typescript
import apiClient from "@/lib/api-client";

// Direct API calls (not recommended for components)
const agents = await apiClient.getAgents();
const newAgent = await apiClient.createAgent({
  name: "My Agent",
  description: "A helpful AI agent",
  status: "draft",
});
```

## React Query Hooks (`react-query.ts`)

React Query hooks provide a better way to manage API state in React components with:

- **Caching**: Automatic caching and background updates
- **Loading States**: Built-in loading and error states
- **Optimistic Updates**: Immediate UI updates with rollback on error
- **Automatic Retries**: Configurable retry logic
- **Cache Invalidation**: Smart cache invalidation on mutations

### Query Hooks (Data Fetching)

#### Authentication

```typescript
import { useCurrentUser } from "@/lib/react-query";

function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Welcome, {user?.user.name}!</div>;
}
```

#### Dashboard Data

```typescript
import { useDashboardData } from "@/lib/react-query";

function Dashboard() {
  const { data: dashboard, isLoading, refetch } = useDashboardData();

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <div>Total Agents: {dashboard?.stats.agents.total}</div>
    </div>
  );
}
```

#### Agents

```typescript
import { useAgents, useAgent } from "@/lib/react-query";

function AgentsList() {
  const { data: agents, isLoading } = useAgents();

  return (
    <div>
      {agents?.map((agent) => (
        <div key={agent.id}>{agent.name}</div>
      ))}
    </div>
  );
}

function AgentDetail({ agentId }: { agentId: string }) {
  const { data: agent, isLoading } = useAgent(agentId);

  if (isLoading) return <div>Loading agent...</div>;

  return <div>{agent?.name}</div>;
}
```

### Mutation Hooks (Data Modification)

#### Creating Resources

```typescript
import { useCreateAgent } from "@/lib/react-query";

function CreateAgentForm() {
  const createAgent = useCreateAgent();

  const handleSubmit = async (formData) => {
    try {
      await createAgent.mutateAsync({
        name: formData.name,
        description: formData.description,
        status: "draft",
      });
      // Success! The cache will be automatically updated
    } catch (error) {
      // Error handling is automatic via toast notifications
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={createAgent.isPending}>
        {createAgent.isPending ? "Creating..." : "Create Agent"}
      </button>
    </form>
  );
}
```

#### Updating Resources

```typescript
import { useUpdateAgent } from "@/lib/react-query";

function EditAgentForm({ agent }) {
  const updateAgent = useUpdateAgent();

  const handleSubmit = async (formData) => {
    await updateAgent.mutateAsync({
      id: agent.id,
      agent: {
        name: formData.name,
        description: formData.description,
        status: formData.status,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={updateAgent.isPending}>
        Update Agent
      </button>
    </form>
  );
}
```

#### Deleting Resources

```typescript
import { useDeleteAgent } from "@/lib/react-query";

function DeleteAgentButton({ agentId }) {
  const deleteAgent = useDeleteAgent();

  const handleDelete = async () => {
    if (confirm("Are you sure?")) {
      await deleteAgent.mutateAsync(agentId);
    }
  };

  return (
    <button onClick={handleDelete} disabled={deleteAgent.isPending}>
      {deleteAgent.isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
```

## Available Hooks

### Query Hooks

- `useHealthCheck()` - API health status
- `useCurrentUser()` - Current authenticated user
- `useDashboardData()` - Dashboard statistics
- `useAgents()` - List all agents
- `useAgent(id)` - Get specific agent
- `useWorkflows()` - List all workflows
- `useWorkflow(id)` - Get specific workflow
- `useIntegrations()` - List all integrations
- `useIntegration(id)` - Get specific integration
- `useExecutions()` - List all executions
- `useExecution(id)` - Get specific execution
- `useExecutionsByWorkflow(workflowId)` - Executions for a workflow
- `useExecutionsByAgent(agentId)` - Executions for an agent

### Mutation Hooks

- `useCreateAgent()` - Create new agent
- `useUpdateAgent()` - Update existing agent
- `useDeleteAgent()` - Delete agent
- `useCreateWorkflow()` - Create new workflow
- `useUpdateWorkflow()` - Update existing workflow
- `useDeleteWorkflow()` - Delete workflow
- `useCreateIntegration()` - Create new integration
- `useUpdateIntegration()` - Update existing integration
- `useDeleteIntegration()` - Delete integration

## Error Handling

All hooks include automatic error handling:

1. **Toast Notifications**: Errors are automatically shown as toast notifications
2. **Console Logging**: Errors are logged to the console for debugging
3. **Retry Logic**: Configurable retry attempts for failed requests
4. **Auth Handling**: Special handling for authentication errors (401/403)

## Query Keys

Query keys are centralized in the `queryKeys` object for consistency:

```typescript
import { queryKeys } from "@/lib/react-query";

// Manually invalidate cache
queryClient.invalidateQueries({ queryKey: queryKeys.agents });

// Manually set cache data
queryClient.setQueryData(queryKeys.agent("123"), updatedAgent);
```

## Best Practices

1. **Use Query Hooks in Components**: Always use the React Query hooks instead of direct API calls in components
2. **Handle Loading States**: Always handle `isLoading` and `error` states
3. **Optimistic Updates**: Mutations automatically handle cache updates
4. **Error Boundaries**: Consider using error boundaries for better error handling
5. **Stale Time**: Hooks are configured with appropriate stale times for each resource type

## Configuration

The React Query client is configured in `router.tsx` with:

- **Refetch on Reconnect**: Automatic refetching when connection is restored
- **Global Error Handling**: Toast notifications for mutation errors
- **Cache Invalidation**: Automatic cache invalidation after mutations

## TypeScript Support

All hooks are fully typed with TypeScript:

- Request types for mutations
- Response types for queries
- Error types for error handling
- Generic support for custom options

## Examples

See the example components:

- `components/dashboard/agents-list.tsx` - Complete CRUD operations
- `components/dashboard/dashboard-overview.tsx` - Multiple query hooks

These demonstrate real-world usage patterns and best practices.
