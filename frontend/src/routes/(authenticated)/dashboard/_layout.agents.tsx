import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconPlus, IconRobot, IconPlayCard, IconTrash, IconUser } from '@tabler/icons-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/(authenticated)/dashboard/_layout/agents')({
  component: AgentsPage,
})

interface Agent {
  id: string
  name: string
  description: string
  config: Record<string, any>
  status: 'draft' | 'active' | 'inactive' | 'error'
  user_id: string
  created_at: string
  updated_at: string
}

interface UserInfo {
  user: {
    id: string
    name: string
    email: string
  }
  session: {
    id: string
    userId: string
    expiresAt: string
  }
}

function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    config: {}
  })

  useEffect(() => {
    fetchAgents()
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const data = await response.json()
      if (data.success) {
        setUserInfo(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/agents', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const data = await response.json()
      if (data.success) {
        setAgents(data.data || [])
      } else {
        console.error('API Error:', data.error)
        toast.error(data.error || 'Failed to load agents')
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      toast.error('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  const createAgent = async () => {
    if (!newAgent.name.trim()) {
      toast.error('Agent name is required')
      return
    }

    try {
      const response = await fetch('http://localhost:8080/api/agents', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAgent)
      })
      
      const data = await response.json()
      if (data.success) {
        setAgents([data.data, ...agents])
        setCreateDialogOpen(false)
        setNewAgent({ name: '', description: '', config: {} })
        toast.success('Agent created successfully')
      } else {
        console.error('API Error:', data.error)
        toast.error(data.error || 'Failed to create agent')
      }
    } catch (error) {
      console.error('Failed to create agent:', error)
      toast.error('Failed to create agent')
    }
  }

  const updateAgentStatus = async (agentId: string, status: string) => {
    try {
      const agent = agents.find(a => a.id === agentId)
      if (!agent) return

      const response = await fetch(`http://localhost:8080/api/agents/${agentId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...agent,
          status
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setAgents(agents.map(a => a.id === agentId ? { ...a, status: status as 'draft' | 'active' | 'inactive' | 'error' } : a))
        toast.success(`Agent ${status === 'active' ? 'activated' : 'deactivated'}`)
      } else {
        console.error('API Error:', data.error)
        toast.error(data.error || 'Failed to update agent')
      }
    } catch (error) {
      console.error('Failed to update agent:', error)
      toast.error('Failed to update agent')
    }
  }

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      const response = await fetch(`http://localhost:8080/api/agents/${agentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setAgents(agents.filter(a => a.id !== agentId))
        toast.success('Agent deleted successfully')
      } else {
        console.error('API Error:', data.error)
        toast.error(data.error || 'Failed to delete agent')
      }
    } catch (error) {
      console.error('Failed to delete agent:', error)
      toast.error('Failed to delete agent')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground">
            Create and manage your AI agents
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>
                Create a new AI agent to automate your workflows
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="Enter agent name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  placeholder="Describe what this agent does"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createAgent}>
                  Create Agent
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Info Debug Card */}
      {userInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <IconUser className="h-5 w-5" />
              Current User (Backend Authentication)
            </CardTitle>
            <CardDescription>
              This shows how the backend identifies and matches you to your agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>User ID:</strong> {userInfo.user.id}
              </div>
              <div>
                <strong>Email:</strong> {userInfo.user.email}
              </div>
              <div>
                <strong>Name:</strong> {userInfo.user.name}
              </div>
              <div>
                <strong>Session ID:</strong> {userInfo.session.id}
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              💡 All agents below are filtered by user_id = "{userInfo.user.id}"
            </div>
          </CardContent>
        </Card>
      )}

      {agents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <IconRobot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first AI agent
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <IconRobot className="h-5 w-5" />
                    {agent.name}
                  </CardTitle>
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>
                <CardDescription>
                  {agent.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(agent.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateAgentStatus(agent.id, 'inactive')}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => updateAgentStatus(agent.id, 'active')}
                      >
                        <IconPlayCard className="mr-1 h-3 w-3" />
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteAgent(agent.id)}
                    >
                      <IconTrash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 