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
import { IconTrash, IconPlus, IconX, IconSettings, IconVariable, IconArrowRight } from '@tabler/icons-react'

interface NodeConfigurationPanelProps {
  node: Node
  nodes: Node[]
  selectedNodeId: string
  onUpdate: (config: any) => void
  onDelete: () => void
}

interface NodeConfig {
  name: string
  description: string
  settings: Record<string, any>
}

export function NodeConfigurationPanel({ node, nodes, selectedNodeId, onUpdate, onDelete }: NodeConfigurationPanelProps) {
  const nodeConfig = node.data.config as NodeConfig | undefined
  const [config, setConfig] = useState<NodeConfig>({
    name: nodeConfig?.name || (node.data.label as string) || '',
    description: nodeConfig?.description || '',
    settings: nodeConfig?.settings || {}
  })

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
    const nodeType = node.data.nodeType

    switch (nodeType) {
      case 'trigger':
        return (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                <IconSettings className="h-4 w-4" />
                Trigger Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trigger-type" className="text-sm font-medium">Trigger Type</Label>
                <Select 
                  value={config.settings.triggerType || 'manual'} 
                  onValueChange={(value) => handleSettingChange('triggerType', value)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select trigger type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="schedule">Scheduled</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {config.settings.triggerType === 'schedule' && (
                <div className="space-y-2">
                  <Label htmlFor="cron" className="text-sm font-medium">Cron Expression</Label>
                  <Input
                    id="cron"
                    value={config.settings.cron || ''}
                    onChange={(e) => handleSettingChange('cron', e.target.value)}
                    placeholder="0 0 * * *"
                    className="bg-white font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">Example: 0 0 * * * (daily at midnight)</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'agent':
        return (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <IconSettings className="h-4 w-4" />
                Agent Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-name" className="text-sm font-medium">Agent Name</Label>
                <Input
                  id="agent-name"
                  value={config.settings.agentName || ''}
                  onChange={(e) => handleSettingChange('agentName', e.target.value)}
                  placeholder="My Agent"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-instructions" className="text-sm font-medium">Instructions</Label>
                <Textarea
                  id="agent-instructions"
                  value={config.settings.instructions || ''}
                  onChange={(e) => handleSettingChange('instructions', e.target.value)}
                  placeholder="You are a helpful assistant."
                  rows={4}
                  className="bg-white resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-model" className="text-sm font-medium">Model</Label>
                <Select 
                  value={config.settings.model || 'openai("gpt-4o-mini")'} 
                  onValueChange={(value) => handleSettingChange('model', value)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='openai("gpt-4o-mini")'>openai("gpt-4o-mini")</SelectItem>
                    <SelectItem value='openai("gpt-4o")'>openai("gpt-4o")</SelectItem>
                    <SelectItem value='openai("gpt-3.5-turbo")'>openai("gpt-3.5-turbo")</SelectItem>
                    <SelectItem value='anthropic("claude-3-sonnet-20240229")'>anthropic("claude-3-sonnet")</SelectItem>
                    <SelectItem value='anthropic("claude-3-haiku-20240307")'>anthropic("claude-3-haiku")</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )

      case 'api':
        return (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
                <IconSettings className="h-4 w-4" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="method" className="text-sm font-medium">Method</Label>
                  <Select 
                    value={config.settings.method || 'GET'} 
                    onValueChange={(value) => handleSettingChange('method', value)}
                  >
                    <SelectTrigger className="bg-white">
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
                    onChange={(e) => handleSettingChange('url', e.target.value)}
                    placeholder="https://api.example.com"
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="headers" className="text-sm font-medium">Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={config.settings.headers || '{}'}
                  onChange={(e) => handleSettingChange('headers', e.target.value)}
                  placeholder='{"Authorization": "Bearer token"}'
                  rows={3}
                  className="bg-white font-mono text-sm resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body" className="text-sm font-medium">Request Body</Label>
                <Textarea
                  id="body"
                  value={config.settings.body || ''}
                  onChange={(e) => handleSettingChange('body', e.target.value)}
                  placeholder="Request body (for POST/PUT requests)"
                  rows={3}
                  className="bg-white resize-none"
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'email':
        return (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                <IconSettings className="h-4 w-4" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="to" className="text-sm font-medium">To</Label>
                <Input
                  id="to"
                  value={config.settings.to || ''}
                  onChange={(e) => handleSettingChange('to', e.target.value)}
                  placeholder="recipient@example.com"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                <Input
                  id="subject"
                  value={config.settings.subject || ''}
                  onChange={(e) => handleSettingChange('subject', e.target.value)}
                  placeholder="Email subject"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body" className="text-sm font-medium">Message</Label>
                <Textarea
                  id="body"
                  value={config.settings.body || ''}
                  onChange={(e) => handleSettingChange('body', e.target.value)}
                  placeholder="Email message content..."
                  rows={4}
                  className="bg-white resize-none"
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'webhook':
        return (
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                <IconSettings className="h-4 w-4" />
                Webhook Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url" className="text-sm font-medium">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  value={config.settings.url || ''}
                  onChange={(e) => handleSettingChange('url', e.target.value)}
                  placeholder="https://hooks.example.com/webhook"
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payload" className="text-sm font-medium">Payload (JSON)</Label>
                <Textarea
                  id="payload"
                  value={config.settings.payload || '{}'}
                  onChange={(e) => handleSettingChange('payload', e.target.value)}
                  placeholder='{"message": "Hello from workflow"}'
                  rows={4}
                  className="bg-white font-mono text-sm resize-none"
                />
              </div>
            </CardContent>
          </Card>
        )

      case 'condition':
        return (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                <IconSettings className="h-4 w-4" />
                Condition Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="condition-type" className="text-sm font-medium">Condition Type</Label>
                <Select 
                  value={config.settings.conditionType || 'simple'} 
                  onValueChange={(value) => handleSettingChange('conditionType', value)}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple Condition</SelectItem>
                    <SelectItem value="expression">JavaScript Expression</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {config.settings.conditionType === 'simple' ? (
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="field" className="text-sm font-medium">Field</Label>
                    <Input
                      id="field"
                      value={config.settings.field || ''}
                      onChange={(e) => handleSettingChange('field', e.target.value)}
                      placeholder="field_name"
                      className="bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="operator" className="text-sm font-medium">Operator</Label>
                      <Select 
                        value={config.settings.operator || 'equals'} 
                        onValueChange={(value) => handleSettingChange('operator', value)}
                      >
                        <SelectTrigger className="bg-white">
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
                        onChange={(e) => handleSettingChange('value', e.target.value)}
                        placeholder="comparison value"
                        className="bg-white"
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
                    onChange={(e) => handleSettingChange('expression', e.target.value)}
                    placeholder="data.status === 'active' && data.count > 10"
                    rows={3}
                    className="bg-white font-mono text-sm resize-none"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return (
          <Card className="border-gray-200 bg-gray-50/50">
            <CardContent className="text-center py-8">
              <p className="text-sm text-gray-500">No specific settings for this node type</p>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="space-y-6 max-h-full overflow-y-auto">
      {/* Node Type Specific Settings */}
      <div>
        {renderNodeTypeSettings()}
      </div>

      <Separator className="my-6" />

      {/* Variables Configuration */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IconVariable className="h-4 w-4" />
            Variables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Variables */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Input Variables</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newInputs = [...(config.settings.inputVariables || []), { name: '', type: 'string', sourceNode: '', sourceVariable: '' }]
                  handleSettingChange('inputVariables', newInputs)
                }}
                className="h-7 px-2"
              >
                <IconPlus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-3">
              {(config.settings.inputVariables || []).map((variable: any, index: number) => (
                <Card key={index} className="border-blue-100 bg-blue-50/30">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Variable name"
                        value={variable.name || ''}
                        onChange={(e) => {
                          const newInputs = [...(config.settings.inputVariables || [])]
                          newInputs[index] = { ...variable, name: e.target.value }
                          handleSettingChange('inputVariables', newInputs)
                        }}
                        className="flex-1 bg-white"
                      />
                      <Select
                        value={variable.type || 'string'}
                        onValueChange={(value) => {
                          const newInputs = [...(config.settings.inputVariables || [])]
                          newInputs[index] = { ...variable, type: value }
                          handleSettingChange('inputVariables', newInputs)
                        }}
                      >
                        <SelectTrigger className="w-20 bg-white">
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
                        onClick={() => {
                          const newInputs = (config.settings.inputVariables || []).filter((_: any, i: number) => i !== index)
                          handleSettingChange('inputVariables', newInputs)
                        }}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <IconX className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2 items-center text-xs text-gray-600">
                      <span className="whitespace-nowrap">Source:</span>
                      <Select
                        value={variable.sourceNode || ''}
                        onValueChange={(value) => {
                          const newInputs = [...(config.settings.inputVariables || [])]
                          newInputs[index] = { ...variable, sourceNode: value, sourceVariable: '' }
                          handleSettingChange('inputVariables', newInputs)
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-white h-7">
                          <SelectValue placeholder="Select node" />
                        </SelectTrigger>
                        <SelectContent>
                          {nodes
                            .filter(n => n.id !== selectedNodeId)
                            .map((sourceNode) => (
                              <SelectItem key={sourceNode.id} value={sourceNode.id}>
                                {(sourceNode.data.config as any)?.settings?.agentName || 
                                 (sourceNode.data.config as any)?.name || 
                                 sourceNode.data.label || 
                                 `Node ${sourceNode.id}`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {variable.sourceNode && (
                        <>
                          <IconArrowRight className="h-3 w-3 text-gray-400" />
                          <Select
                            value={variable.sourceVariable || ''}
                            onValueChange={(value) => {
                              const newInputs = [...(config.settings.inputVariables || [])]
                              newInputs[index] = { ...variable, sourceVariable: value }
                              handleSettingChange('inputVariables', newInputs)
                            }}
                          >
                            <SelectTrigger className="flex-1 bg-white h-7">
                              <SelectValue placeholder="Select variable" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const sourceNode = nodes.find(n => n.id === variable.sourceNode)
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
                  </CardContent>
                </Card>
              ))}
              {(config.settings.inputVariables || []).length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  No input variables defined
                </div>
              )}
            </div>
          </div>

          {/* Output Variables */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Output Variables</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOutputs = [...(config.settings.outputVariables || []), { name: '', type: 'string' }]
                  handleSettingChange('outputVariables', newOutputs)
                }}
                className="h-7 px-2"
              >
                <IconPlus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {(config.settings.outputVariables || []).map((variable: any, index: number) => (
                <Card key={index} className="border-green-100 bg-green-50/30">
                  <CardContent className="p-3">
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Variable name"
                        value={variable.name || ''}
                        onChange={(e) => {
                          const newOutputs = [...(config.settings.outputVariables || [])]
                          newOutputs[index] = { ...variable, name: e.target.value }
                          handleSettingChange('outputVariables', newOutputs)
                        }}
                        className="flex-1 bg-white"
                      />
                      <Select
                        value={variable.type || 'string'}
                        onValueChange={(value) => {
                          const newOutputs = [...(config.settings.outputVariables || [])]
                          newOutputs[index] = { ...variable, type: value }
                          handleSettingChange('outputVariables', newOutputs)
                        }}
                      >
                        <SelectTrigger className="w-20 bg-white">
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
                        onClick={() => {
                          const newOutputs = (config.settings.outputVariables || []).filter((_: any, i: number) => i !== index)
                          handleSettingChange('outputVariables', newOutputs)
                        }}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <IconX className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(config.settings.outputVariables || []).length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  No output variables defined
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Actions */}
      <Card className="border-red-200 bg-red-50/30">
        <CardContent className="p-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="w-full"
          >
            <IconTrash className="h-4 w-4 mr-2" />
            Delete Node
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 