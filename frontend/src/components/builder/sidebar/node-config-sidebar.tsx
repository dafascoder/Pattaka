import { useState } from 'react'
import { Node } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from '@/components/ui/sidebar'
import { 
  IconTrash, 
  IconPlus, 
  IconX, 
  IconSettings, 
  IconVariable, 
  IconArrowRight,
  IconLighter,
  IconRobot,
  IconApi,
  IconMail,
  IconWebhook,
  IconGitBranch,
  IconClock,
  IconPlayerPlay
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

// Types
interface NodeConfig {
  name: string
  description: string
  settings: Record<string, any>
}

interface Variable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
}

interface InputVariable extends Variable {
  sourceNode: string
  sourceVariable: string
}

interface NodeConfigSidebarProps {
  node: Node | null
  nodes: Node[]
  selectedNodeId: string | null
  onUpdate: (config: any) => void
  onDelete: () => void
  onClose: () => void
}

// Node type configurations
const NODE_TYPE_CONFIGS = {
  trigger: {
    icon: IconLighter,
    color: 'emerald',
    label: 'Trigger Configuration'
  },
  agent: {
    icon: IconRobot,
    color: 'blue',
    label: 'Agent Configuration'
  },
  api: {
    icon: IconApi,
    color: 'purple',
    label: 'API Configuration'
  },
  email: {
    icon: IconMail,
    color: 'orange',
    label: 'Email Configuration'
  },
  webhook: {
    icon: IconWebhook,
    color: 'red',
    label: 'Webhook Configuration'
  },
  condition: {
    icon: IconGitBranch,
    color: 'amber',
    label: 'Condition Configuration'
  }
} as const

// Component for Variable Management
interface VariableManagerProps {
  variables: Variable[]
  type: 'input' | 'output'
  nodes?: Node[]
  selectedNodeId?: string
  onChange: (variables: Variable[]) => void
}

function VariableManager({ variables, type, nodes, selectedNodeId, onChange }: VariableManagerProps) {
  const addVariable = () => {
    const newVar = type === 'input' 
      ? { name: '', type: 'string' as const, sourceNode: '', sourceVariable: '' }
      : { name: '', type: 'string' as const }
    onChange([...variables, newVar])
  }

  const updateVariable = (index: number, updates: Partial<Variable>) => {
    const newVariables = [...variables]
    newVariables[index] = { ...newVariables[index], ...updates }
    onChange(newVariables)
  }

  const removeVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index))
  }

  const colorClass = type === 'input' ? 'blue' : 'green'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium capitalize">
          {type} Variables
        </Label>
        <Button
          variant="outline"
          size="sm"
          onClick={addVariable}
          className="h-7 px-2"
        >
          <IconPlus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
      
      <div className="space-y-2">
        {variables.map((variable, index) => (
          <Card key={index} className={cn(
            "transition-all duration-200 hover:shadow-sm",
            type === 'input' ? "border-blue-100 bg-blue-50/30" : "border-green-100 bg-green-50/30"
          )}>
            <CardContent className="p-3 space-y-3">
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Variable name"
                  value={variable.name}
                  onChange={(e) => updateVariable(index, { name: e.target.value })}
                  className="flex-1 bg-background h-8"
                />
                <Select
                  value={variable.type}
                  onValueChange={(value: any) => updateVariable(index, { type: value })}
                >
                  <SelectTrigger className="w-20 bg-background h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">str</SelectItem>
                    <SelectItem value="number">num</SelectItem>
                    <SelectItem value="boolean">bool</SelectItem>
                    <SelectItem value="object">obj</SelectItem>
                    <SelectItem value="array">arr</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariable(index)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <IconX className="h-3 w-3" />
                </Button>
              </div>
              
              {type === 'input' && nodes && selectedNodeId && (
                <div className="flex gap-2 items-center text-xs text-muted-foreground">
                  <span className="whitespace-nowrap">Source:</span>
                  <Select
                    value={(variable as InputVariable).sourceNode || ''}
                    onValueChange={(value) => updateVariable(index, { sourceNode: value, sourceVariable: '' } as any)}
                  >
                    <SelectTrigger className="flex-1 bg-background h-7">
                      <SelectValue placeholder="Select node" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes
                        .filter(n => n.id !== selectedNodeId)
                        .map((sourceNode) => (
                          <SelectItem key={sourceNode.id} value={sourceNode.id}>
                            {(sourceNode.data.config as any)?.name || 
                             sourceNode.data.label || 
                             `Node ${sourceNode.id}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {(variable as InputVariable).sourceNode && (
                    <>
                      <IconArrowRight className="h-3 w-3 opacity-50" />
                      <Select
                        value={(variable as InputVariable).sourceVariable || ''}
                        onValueChange={(value) => updateVariable(index, { sourceVariable: value } as any)}
                      >
                        <SelectTrigger className="flex-1 bg-background h-7">
                          <SelectValue placeholder="Select variable" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const sourceNode = nodes.find(n => n.id === (variable as InputVariable).sourceNode)
                            const outputVars = (sourceNode?.data?.config as any)?.settings?.outputVariables || []
                            return outputVars.map((outputVar: any, varIndex: number) => (
                              <SelectItem key={varIndex} value={outputVar.name}>
                                {outputVar.name} ({outputVar.type})
                              </SelectItem>
                            ))
                          })()}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {variables.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
            No {type} variables defined
          </div>
        )}
      </div>
    </div>
  )
}

// Node Type Specific Configuration Components
function TriggerConfig({ config, onSettingChange }: { config: NodeConfig, onSettingChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="trigger-type" className="text-sm font-medium">Trigger Type</Label>
        <Select 
          value={config.settings.triggerType || 'manual'} 
          onValueChange={(value) => onSettingChange('triggerType', value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select trigger type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">
              <div className="flex items-center gap-2">
                <IconPlayerPlay className="h-4 w-4" />
                Manual
              </div>
            </SelectItem>
            <SelectItem value="schedule">
              <div className="flex items-center gap-2">
                <IconClock className="h-4 w-4" />
                Scheduled
              </div>
            </SelectItem>
            <SelectItem value="webhook">
              <div className="flex items-center gap-2">
                <IconWebhook className="h-4 w-4" />
                Webhook
              </div>
            </SelectItem>
            <SelectItem value="email">
              <div className="flex items-center gap-2">
                <IconMail className="h-4 w-4" />
                Email
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {config.settings.triggerType === 'schedule' && (
        <div className="space-y-2">
          <Label htmlFor="cron" className="text-sm font-medium">Cron Expression</Label>
          <Input
            id="cron"
            value={config.settings.cron || ''}
            onChange={(e) => onSettingChange('cron', e.target.value)}
            placeholder="0 0 * * *"
            className="bg-background font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">Example: 0 0 * * * (daily at midnight)</p>
        </div>
      )}
    </div>
  )
}

function AgentConfig({ config, onSettingChange }: { config: NodeConfig, onSettingChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="agent-name" className="text-sm font-medium">Agent Name</Label>
        <Input
          id="agent-name"
          value={config.settings.agentName || ''}
          onChange={(e) => onSettingChange('agentName', e.target.value)}
          placeholder="My Agent"
          className="bg-background"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="agent-instructions" className="text-sm font-medium">Instructions</Label>
        <Textarea
          id="agent-instructions"
          value={config.settings.instructions || ''}
          onChange={(e) => onSettingChange('instructions', e.target.value)}
          placeholder="You are a helpful assistant."
          rows={4}
          className="bg-background resize-none"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="agent-model" className="text-sm font-medium">Model</Label>
        <Select 
          value={config.settings.model || 'openai("gpt-4o-mini")'} 
          onValueChange={(value) => onSettingChange('model', value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='openai("gpt-4o-mini")'>GPT-4o Mini</SelectItem>
            <SelectItem value='openai("gpt-4o")'>GPT-4o</SelectItem>
            <SelectItem value='openai("gpt-3.5-turbo")'>GPT-3.5 Turbo</SelectItem>
            <SelectItem value='anthropic("claude-3-sonnet-20240229")'>Claude 3 Sonnet</SelectItem>
            <SelectItem value='anthropic("claude-3-haiku-20240307")'>Claude 3 Haiku</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function ApiConfig({ config, onSettingChange }: { config: NodeConfig, onSettingChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="method" className="text-sm font-medium">Method</Label>
          <Select 
            value={config.settings.method || 'GET'} 
            onValueChange={(value) => onSettingChange('method', value)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="url" className="text-sm font-medium">URL</Label>
          <Input
            id="url"
            value={config.settings.url || ''}
            onChange={(e) => onSettingChange('url', e.target.value)}
            placeholder="https://api.example.com"
            className="bg-background"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="headers" className="text-sm font-medium">Headers (JSON)</Label>
        <Textarea
          id="headers"
          value={config.settings.headers || '{}'}
          onChange={(e) => onSettingChange('headers', e.target.value)}
          placeholder='{"Authorization": "Bearer token"}'
          rows={3}
          className="bg-background font-mono text-sm resize-none"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="body" className="text-sm font-medium">Request Body</Label>
        <Textarea
          id="body"
          value={config.settings.body || ''}
          onChange={(e) => onSettingChange('body', e.target.value)}
          placeholder="Request body (for POST/PUT requests)"
          rows={3}
          className="bg-background resize-none"
        />
      </div>
    </div>
  )
}

function EmailConfig({ config, onSettingChange }: { config: NodeConfig, onSettingChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="to" className="text-sm font-medium">To</Label>
        <Input
          id="to"
          value={config.settings.to || ''}
          onChange={(e) => onSettingChange('to', e.target.value)}
          placeholder="recipient@example.com"
          className="bg-background"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
        <Input
          id="subject"
          value={config.settings.subject || ''}
          onChange={(e) => onSettingChange('subject', e.target.value)}
          placeholder="Email subject"
          className="bg-background"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium">Message</Label>
        <Textarea
          id="message"
          value={config.settings.body || ''}
          onChange={(e) => onSettingChange('body', e.target.value)}
          placeholder="Email message content..."
          rows={4}
          className="bg-background resize-none"
        />
      </div>
    </div>
  )
}

function WebhookConfig({ config, onSettingChange }: { config: NodeConfig, onSettingChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="webhook-url" className="text-sm font-medium">Webhook URL</Label>
        <Input
          id="webhook-url"
          value={config.settings.url || ''}
          onChange={(e) => onSettingChange('url', e.target.value)}
          placeholder="https://hooks.example.com/webhook"
          className="bg-background"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="payload" className="text-sm font-medium">Payload (JSON)</Label>
        <Textarea
          id="payload"
          value={config.settings.payload || '{}'}
          onChange={(e) => onSettingChange('payload', e.target.value)}
          placeholder='{"message": "Hello from workflow"}'
          rows={4}
          className="bg-background font-mono text-sm resize-none"
        />
      </div>
    </div>
  )
}

function ConditionConfig({ config, onSettingChange }: { config: NodeConfig, onSettingChange: (key: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="condition-type" className="text-sm font-medium">Condition Type</Label>
        <Select 
          value={config.settings.conditionType || 'simple'} 
          onValueChange={(value) => onSettingChange('conditionType', value)}
        >
          <SelectTrigger className="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simple Condition</SelectItem>
            <SelectItem value="expression">JavaScript Expression</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {config.settings.conditionType === 'simple' ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="field" className="text-sm font-medium">Field</Label>
            <Input
              id="field"
              value={config.settings.field || ''}
              onChange={(e) => onSettingChange('field', e.target.value)}
              placeholder="field_name"
              className="bg-background"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="operator" className="text-sm font-medium">Operator</Label>
              <Select 
                value={config.settings.operator || 'equals'} 
                onValueChange={(value) => onSettingChange('operator', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value" className="text-sm font-medium">Value</Label>
              <Input
                id="value"
                value={config.settings.value || ''}
                onChange={(e) => onSettingChange('value', e.target.value)}
                placeholder="comparison value"
                className="bg-background"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="expression" className="text-sm font-medium">JavaScript Expression</Label>
          <Textarea
            id="expression"
            value={config.settings.expression || ''}
            onChange={(e) => onSettingChange('expression', e.target.value)}
            placeholder="data.status === 'active' && data.count > 10"
            rows={3}
            className="bg-background font-mono text-sm resize-none"
          />
        </div>
      )}
    </div>
  )
}

export function NodeConfigSidebar({ node, nodes, selectedNodeId, onUpdate, onDelete, onClose }: NodeConfigSidebarProps) {
  const nodeConfig = node?.data.config as NodeConfig | undefined
  const [config, setConfig] = useState<NodeConfig>({
    name: nodeConfig?.name || (node?.data.label as string) || '',
    description: nodeConfig?.description || '',
    settings: nodeConfig?.settings || {}
  })
  const { state } = useSidebar()

  const nodeType = node?.data.nodeType as keyof typeof NODE_TYPE_CONFIGS
  const nodeTypeConfig = node ? NODE_TYPE_CONFIGS[nodeType] : null

  const handleConfigChange = (field: string, value: any) => {
    const newConfig = { ...config, [field]: value }
    setConfig(newConfig)
    onUpdate(newConfig)
  }

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...config.settings, [key]: value }
    const newConfig = { ...config, settings: newSettings }
    setConfig(newConfig)
    onUpdate(newConfig)
  }

  const renderNodeTypeSettings = () => {
    if (!node) return null
    
    const props = { config, onSettingChange: handleSettingChange }
    
    switch (nodeType) {
      case 'trigger': return <TriggerConfig {...props} />
      case 'agent': return <AgentConfig {...props} />
      case 'api': return <ApiConfig {...props} />
      case 'email': return <EmailConfig {...props} />
      case 'webhook': return <WebhookConfig {...props} />
      case 'condition': return <ConditionConfig {...props} />
      default: return (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No specific settings for this node type</p>
        </div>
      )
    }
  }

  // If no node is selected, show a default state
  if (!node) {
    return (
      <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex"
      >
        <SidebarContent className="gap-0">
          <SidebarHeader className="px-4 py-3 border-b border-border/40 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconSettings className="h-4 w-4" />
                <h3 className="font-semibold text-sm">
                  {state === 'expanded' ? 'Configuration' : ''}
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          </SidebarHeader>

          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                <IconSettings className="h-8 w-8 text-muted-foreground/50" />
              </div>
              {state === 'expanded' && (
                <>
                  <h3 className="font-medium text-sm text-foreground">No Step Selected</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    Select a step in your workflow to configure its settings and variables.
                  </p>
                </>
              )}
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar 
      side="right" 
      variant="sidebar" 
      collapsible="icon"
      className={cn(
        "border-l border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300 ease-in-out"
      )}
    >
      <SidebarContent className="gap-0">
        <SidebarHeader className="px-4 py-3 border-b border-border/40 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconSettings className="h-4 w-4" />
              <h3 className="font-semibold text-sm">
                {state === 'expanded' ? `Step: ${config.name || 'Unnamed'}` : ''}
              </h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </SidebarHeader>

        {/* Basic Configuration */}
        <SidebarGroup className="px-2 py-3">
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
            Basic Settings
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2 px-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="node-name" className="text-sm font-medium">Step Title</Label>
                <Input
                  id="node-name"
                  value={config.name}
                  onChange={(e) => handleConfigChange('name', e.target.value)}
                  className="bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="node-description" className="text-sm font-medium">Step Description</Label>
                <Textarea
                  id="node-description"
                  value={config.description}
                  onChange={(e) => handleConfigChange('description', e.target.value)}
                  rows={3}
                  className="bg-background resize-none"
                />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Node Type Specific Configuration */}
        {nodeTypeConfig && (
          <SidebarGroup className="px-2 py-3 border-t border-border/20">
            <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-2">
              <nodeTypeConfig.icon className="h-3 w-3" />
              {nodeTypeConfig.label}
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-2 px-2">
              <Card className={cn(
                "border transition-all duration-200",
                `border-${nodeTypeConfig.color}-200 bg-${nodeTypeConfig.color}-50/30`
              )}>
                <CardContent className="p-4">
                  {renderNodeTypeSettings()}
                </CardContent>
              </Card>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Variables Configuration */}
        <SidebarGroup className="px-2 py-3 border-t border-border/20">
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-2">
            <IconVariable className="h-3 w-3" />
            Variables
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-2 px-2">
            <Card className="border-slate-200 bg-slate-50/30">
              <CardContent className="p-4 space-y-6">
                <VariableManager
                  variables={config.settings.inputVariables || []}
                  type="input"
                  nodes={nodes}
                  selectedNodeId={selectedNodeId || undefined}
                  onChange={(variables) => handleSettingChange('inputVariables', variables)}
                />
                
                <Separator />
                
                <VariableManager
                  variables={config.settings.outputVariables || []}
                  type="output"
                  onChange={(variables) => handleSettingChange('outputVariables', variables)}
                />
              </CardContent>
            </Card>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Delete Action */}
        <SidebarGroup className="px-2 py-3 border-t border-border/20 mt-auto">
          <SidebarGroupContent className="px-2">
            <Button 
              variant="destructive" 
              onClick={onDelete} 
              className="w-full h-9"
              size="sm"
            >
              <IconTrash className="h-4 w-4 mr-2" />
              {state === 'expanded' ? 'Delete Step' : ''}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
