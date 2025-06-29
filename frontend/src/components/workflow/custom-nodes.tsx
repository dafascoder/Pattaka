import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { IconLighter, IconRobot, IconApi, IconMail, IconWebhook, IconGitBranch } from '@tabler/icons-react'

interface CustomNodeData {
  label: string
  nodeType: string
  config?: {
    name?: string
    description?: string
    settings?: Record<string, any>
  }
}

const getNodeIcon = (nodeType: string) => {
  switch (nodeType) {
    case 'trigger':
      return IconLighter
    case 'agent':
      return IconRobot
    case 'api':
      return IconApi
    case 'email':
      return IconMail
    case 'webhook':
      return IconWebhook
    case 'condition':
      return IconGitBranch
    default:
      return IconLighter
  }
}

const getNodeColor = (nodeType: string) => {
  switch (nodeType) {
    case 'trigger':
      return 'border-green-200 bg-green-50 text-green-800'
    case 'agent':
      return 'border-blue-200 bg-blue-50 text-blue-800'
    case 'api':
      return 'border-purple-200 bg-purple-50 text-purple-800'
    case 'email':
      return 'border-orange-200 bg-orange-50 text-orange-800'
    case 'webhook':
      return 'border-red-200 bg-red-50 text-red-800'
    case 'condition':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-800'
  }
}

const getNodeInfo = (nodeType: string, config?: any) => {
  switch (nodeType) {
    case 'trigger':
      return config?.settings?.triggerType || 'Manual'
    case 'agent':
      return config?.settings?.agentName || config?.name || 'Unnamed Agent'
    case 'api':
      return `${config?.settings?.method || 'GET'} ${config?.settings?.url ? new URL(config.settings.url).hostname : 'API'}`
    case 'email':
      return config?.settings?.to || 'Email'
    case 'webhook':
      return config?.settings?.url ? new URL(config.settings.url).hostname : 'Webhook'
    case 'condition':
      return config?.settings?.conditionType === 'expression' ? 'JS Expression' : 'Simple Condition'
    default:
      return nodeType
  }
}

export const CustomNode = memo(({ data, selected }: NodeProps & { data: CustomNodeData }) => {
  const IconComponent = getNodeIcon(data.nodeType)
  const nodeColor = getNodeColor(data.nodeType)
  const nodeInfo = getNodeInfo(data.nodeType, data.config)
  
  // Get input and output variables
  const inputVariables = data.config?.settings?.inputVariables || []
  const outputVariables = data.config?.settings?.outputVariables || []

  return (
    <Card className={`min-w-[200px] shadow-md transition-all duration-200 ${nodeColor} ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <IconComponent className="h-4 w-4" />
          {data.label}
        </CardTitle>
        <div className="text-xs opacity-75">
          {nodeInfo}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Input Variables */}
        {inputVariables.length > 0 && (
          <div className="mb-2">
            <div className="text-xs font-medium mb-1">Inputs:</div>
            <div className="flex flex-wrap gap-1">
              {inputVariables.map((variable: any, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {variable.sourceVariable ? `← ${variable.sourceVariable}` : variable.name}
                  <span className="ml-1 text-xs opacity-60">({variable.type})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Output Variables */}
        {outputVariables.length > 0 && (
          <div>
            <div className="text-xs font-medium mb-1">Outputs:</div>
            <div className="flex flex-wrap gap-1">
              {outputVariables.map((variable: any, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {variable.name}
                  <span className="ml-1 text-xs opacity-60">({variable.type})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
    </Card>
  )
})

CustomNode.displayName = 'CustomNode'

export const nodeTypes = {
  customNode: CustomNode
} 