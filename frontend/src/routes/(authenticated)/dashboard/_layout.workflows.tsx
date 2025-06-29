import { useState } from 'react'
import { createFileRoute, Link, useLoaderData } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconGitBranch, IconPlus, IconPlayCard, IconTrash, IconRobot } from '@tabler/icons-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/(authenticated)/dashboard/_layout/workflows')({
  component: WorkflowsPage,
  loader: async ({ context }) => {
    const { queryClient } = context
    const workflows = await queryClient.fetchQuery({
      queryKey: ['workflows'],
      queryFn: () => fetch('http://localhost:8080/api/workflows', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    })

    const agents = await queryClient.fetchQuery({
      queryKey: ['agents'],
      queryFn: () => fetch('http://localhost:8080/api/agents', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    })

    const workflowsData = await workflows.json()
    const agentsData = await agents.json()

    return { workflows: workflowsData, agents: agentsData }
  },
})

interface Workflow {
  id: string
  agent_id: string
  name: string
  description: string
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AgentOption {
  id: string
  name: string
}

// --------------------------------------------
// Page Component
// --------------------------------------------

function WorkflowsPage() {
  // Grab prefetched data from TanStack loader
  const { workflows: workflowsResult, agents: agentsResult } = useLoaderData({
    from: '/(authenticated)/dashboard/_layout/workflows',
  }) as {
    workflows: { success?: boolean; data?: Workflow[] } | Workflow[]
    agents: { success?: boolean; data?: any[] } | any[]
  }

  // Extract arrays irrespective of response wrapper shape
  const initialWorkflows: Workflow[] = Array.isArray(workflowsResult)
    ? workflowsResult
    : (workflowsResult?.data ?? [])

  const initialAgentOptions: AgentOption[] = Array.isArray(agentsResult)
    ? (agentsResult as any[]).map((a: any) => ({ id: a.id, name: a.name }))
    : ((agentsResult?.data ?? []) as any[]).map((a: any) => ({ id: a.id, name: a.name }))

  // Local state to allow optimistic updates after create/delete
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows)
  const [agentOptions] = useState<AgentOption[]>(initialAgentOptions)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    agent_id: '',
    name: '',
    description: '',
  })

  const createWorkflow = async () => {
    if (!newWorkflow.name.trim() || !newWorkflow.agent_id) {
      toast.error('Name and Agent are required')
      return
    }

    try {
      const response = await fetch('http://localhost:8080/api/workflows', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...newWorkflow, definition: {}, is_active: true }),
      })

      const data = await response.json()
      if (data.success) {
        setWorkflows([data.data, ...workflows])
        setCreateDialogOpen(false)
        setNewWorkflow({ agent_id: '', name: '', description: '' })
        toast.success('Workflow created successfully')
      } else {
        toast.error(data.error || 'Failed to create workflow')
      }
    } catch (error) {
      console.error('Failed to create workflow:', error)
      toast.error('Failed to create workflow')
    }
  }

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      const response = await fetch(`http://localhost:8080/api/workflows/${workflowId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      if (data.success) {
        setWorkflows(workflows.filter((w) => w.id !== workflowId))
        toast.success('Workflow deleted successfully')
      } else {
        toast.error(data.error || 'Failed to delete workflow')
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error)
      toast.error('Failed to delete workflow')
    }
  }

  const getStatusColor = (isActive: boolean) =>
    isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'

  // --------------------------------------------
  // JSX
  // --------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header & New Workflow */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">Manage and monitor your automation workflows</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Provide details for your workflow. You can edit the workflow graph later in the builder.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <Label htmlFor="agent">Agent</Label>
                <Select
                  value={newWorkflow.agent_id}
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, agent_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentOptions.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Describe what this workflow does"
                />
              </div>
              <Button onClick={createWorkflow}>Create Workflow</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <IconGitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <IconPlayCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter((w) => w.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <IconRobot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.filter((w) => !w.is_active).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow List</CardTitle>
          <CardDescription>Your saved workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center p-4">No workflows found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">{workflow.name}</TableCell>
                    <TableCell>
                      {agentOptions.find((a) => a.id === workflow.agent_id)?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(workflow.is_active)}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link to="/builder">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => deleteWorkflow(workflow.id)}
                      >
                        <IconTrash className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
