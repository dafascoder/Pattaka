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
import { IconPlus, IconPlug, IconSettings, IconTrash, IconApi, IconMail, IconBrandSlack, IconBrandDiscord, IconWebhook } from '@tabler/icons-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/(authenticated)/dashboard/_layout/integrations')({
  component: IntegrationsPage,
})

interface Integration {
  id: string
  name: string
  type: string
  config: Record<string, any>
  user_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const integrationTypes = [
  { value: 'api', label: 'HTTP API', icon: IconApi },
  { value: 'webhook', label: 'Webhook', icon: IconWebhook },
  { value: 'email', label: 'Email', icon: IconMail },
]

const popularIntegrations = [
  { name: 'Slack', type: 'api', icon: IconBrandSlack, description: 'Send messages and notifications to Slack channels' },
  { name: 'Discord', type: 'api', icon: IconBrandDiscord, description: 'Send messages to Discord servers' },
  { name: 'HTTP API', type: 'api', icon: IconApi, description: 'Connect to any REST API endpoint' },
  { name: 'Webhook', type: 'webhook', icon: IconWebhook, description: 'Receive HTTP webhooks from external services' },
  { name: 'Email', type: 'email', icon: IconMail, description: 'Send email notifications' },
]

function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: '',
    config: {},
    credentials: {}
  })

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/integrations', {
        headers: {
          'X-User-ID': 'demo-user'
        }
      })
      const data = await response.json()
      if (data.success) {
        setIntegrations(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
      toast.error('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  const createIntegration = async () => {
    if (!newIntegration.name.trim() || !newIntegration.type) {
      toast.error('Name and type are required')
      return
    }

    try {
      const response = await fetch('http://localhost:8080/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': 'demo-user'
        },
        body: JSON.stringify(newIntegration)
      })
      
      const data = await response.json()
      if (data.success) {
        setIntegrations([data.data, ...integrations])
        setCreateDialogOpen(false)
        setNewIntegration({ name: '', type: '', config: {}, credentials: {} })
        toast.success('Integration created successfully')
      } else {
        toast.error(data.error || 'Failed to create integration')
      }
    } catch (error) {
      console.error('Failed to create integration:', error)
      toast.error('Failed to create integration')
    }
  }

  const deleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return

    try {
      const response = await fetch(`http://localhost:8080/api/integrations/${integrationId}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': 'demo-user'
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setIntegrations(integrations.filter(i => i.id !== integrationId))
        toast.success('Integration deleted successfully')
      } else {
        toast.error(data.error || 'Failed to delete integration')
      }
    } catch (error) {
      console.error('Failed to delete integration:', error)
      toast.error('Failed to delete integration')
    }
  }

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'api': return IconApi
      case 'webhook': return IconWebhook
      case 'email': return IconMail
      default: return IconPlug
    }
  }

  const handleQuickAdd = (integration: any) => {
    setNewIntegration({
      name: integration.name,
      type: integration.type,
      config: {},
      credentials: {}
    })
    setSelectedIntegration(integration)
    setCreateDialogOpen(true)
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
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your agents to external services and APIs
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <IconPlus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>
                Connect a new service to your agent platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({ ...newIntegration, name: e.target.value })}
                  placeholder="Enter integration name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={newIntegration.type} onValueChange={(value) => setNewIntegration({ ...newIntegration, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration type" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createIntegration}>
                  Add Integration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Popular Integrations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Popular Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {popularIntegrations.map((integration) => {
            const IconComponent = integration.icon
            const isAdded = integrations.some(i => i.name === integration.name)
            
            return (
              <Card key={integration.name} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {integration.name}
                    </CardTitle>
                    {isAdded && <Badge variant="secondary">Added</Badge>}
                  </div>
                  <CardDescription>
                    {integration.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant={isAdded ? "outline" : "default"}
                    disabled={isAdded}
                    onClick={() => handleQuickAdd(integration)}
                  >
                    {isAdded ? 'Already Added' : 'Add Integration'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Your Integrations */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Integrations</h2>
        {integrations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <IconPlug className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No integrations yet</h3>
              <p className="text-muted-foreground mb-4">
                Connect your first service to get started
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                Add Your First Integration
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration) => {
              const IconComponent = getIntegrationIcon(integration.type)
              
              return (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5" />
                        {integration.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {integration.user_id !== 'system' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteIntegration(integration.id)}
                          >
                            <IconTrash className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      Type: {integration.type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {integration.user_id === 'system' ? 'System Integration' : 'Custom Integration'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(integration.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 