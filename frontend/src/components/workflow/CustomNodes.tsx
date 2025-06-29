import { Handle, Position, NodeTypes } from '@xyflow/react'
import { 
  IconPlayCard, 
  IconRobot, 
  IconApi, 
  IconMail, 
  IconWebhook, 
  IconGitBranch 
} from '@tabler/icons-react'

const nodeTypeStyles = {
  trigger: { bgColor: '#dbeafe', borderColor: '#93c5fd', iconColor: '#2563eb', ringColor: 'ring-blue-500' },
  agent: { bgColor: '#f3e8ff', borderColor: '#c4b5fd', iconColor: '#7c3aed', ringColor: 'ring-purple-500' },
  api: { bgColor: '#fed7aa', borderColor: '#fdba74', iconColor: '#ea580c', ringColor: 'ring-orange-500' },
  email: { bgColor: '#fef3c7', borderColor: '#fcd34d', iconColor: '#d97706', ringColor: 'ring-yellow-500' },
  webhook: { bgColor: '#fce7f3', borderColor: '#f9a8d4', iconColor: '#ec4899', ringColor: 'ring-pink-500' },
  condition: { bgColor: '#f3f4f6', borderColor: '#d1d5db', iconColor: '#6b7280', ringColor: 'ring-gray-500' },
}

const nodeTypeIcons = {
  trigger: IconPlayCard,
  agent: IconRobot,
  api: IconApi,
  email: IconMail,
  webhook: IconWebhook,
  condition: IconGitBranch,
}

interface CustomNodeProps {
  data: {
    label: string
    nodeType: string
    config?: {
      name?: string
      description?: string
      settings?: Record<string, any>
    }
  }
  selected?: boolean
}

// Helper function to render variables
const renderVariables = (variables: any[], type: 'input' | 'output', style: any) => {
  if (!variables || variables.length === 0) return null
  
  return (
    <div className="mt-2">
      <div className="text-xs font-medium text-gray-500 mb-1">
        {type === 'input' ? '📥 Inputs' : '📤 Outputs'}
      </div>
      <div className="space-y-1">
        {variables.slice(0, 3).map((variable: any, index: number) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">{variable.name}</span>
              <span className="text-xs px-1 rounded" style={{
                backgroundColor: style.bgColor,
                color: style.iconColor
              }}>
                {variable.type}
              </span>
            </div>
            {type === 'input' && variable.sourceNode && variable.sourceVariable && (
              <div className="text-xs text-gray-400 ml-1">
                ← {variable.sourceVariable}
              </div>
            )}
          </div>
        ))}
        {variables.length > 3 && (
          <div className="text-xs text-gray-400">+{variables.length - 3} more</div>
        )}
      </div>
    </div>
  )
}

function TriggerNode({ data, selected }: CustomNodeProps) {
  const style = nodeTypeStyles.trigger
  const IconComponent = nodeTypeIcons.trigger
  
  return (
    <div className={`relative rounded-lg border-2 bg-white shadow-md transition-all duration-200 ${
      selected ? `ring-2 ${style.ringColor} ring-offset-2` : 'hover:shadow-lg'
    }`} style={{ 
      borderColor: style.borderColor,
      minWidth: '180px'
    }}>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: style.bgColor }}
          >
            <IconComponent 
              className="h-5 w-5" 
              style={{ color: style.iconColor }}
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">
              {data.config?.name || data.label}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Trigger
            </div>
          </div>
        </div>
        
        {data.config?.description && (
          <div className="text-xs text-gray-600 mt-2 line-clamp-2">
            {data.config.description}
          </div>
        )}
        
        {data.config?.settings?.triggerType && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{
              backgroundColor: style.bgColor,
              color: style.iconColor
            }}>
              {data.config.settings.triggerType}
            </span>
          </div>
        )}

        {renderVariables(data.config?.settings?.outputVariables, 'output', style)}
      </div>
    </div>
  )
}

function AgentNode({ data, selected }: CustomNodeProps) {
  const style = nodeTypeStyles.agent
  const IconComponent = nodeTypeIcons.agent
  
  return (
    <div className={`relative rounded-lg border-2 bg-white shadow-md transition-all duration-200 ${
      selected ? `ring-2 ${style.ringColor} ring-offset-2` : 'hover:shadow-lg'
    }`} style={{ 
      borderColor: style.borderColor,
      minWidth: '220px'
    }}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: style.bgColor }}
          >
            <IconComponent 
              className="h-5 w-5" 
              style={{ color: style.iconColor }}
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">
              {data.config?.settings?.agentName || data.config?.name || data.label}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Agent
            </div>
          </div>
        </div>
        
        {data.config?.settings?.instructions && (
          <div className="text-xs text-gray-600 mt-2 line-clamp-2">
            {data.config.settings.instructions}
          </div>
        )}
        
        {data.config?.settings?.model && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium" style={{
              backgroundColor: style.bgColor,
              color: style.iconColor
            }}>
              {data.config.settings.model.replace(/[()]/g, '').replace(/"/g, '')}
            </span>
          </div>
        )}

        {renderVariables(data.config?.settings?.inputVariables, 'input', style)}
        {renderVariables(data.config?.settings?.outputVariables, 'output', style)}
        
        {data.config?.description && (
          <div className="text-xs text-gray-600 mt-2 line-clamp-2 border-t pt-2">
            {data.config.description}
          </div>
        )}
      </div>
    </div>
  )
}

function ApiNode({ data, selected }: CustomNodeProps) {
  const style = nodeTypeStyles.api
  const IconComponent = nodeTypeIcons.api
  
  return (
    <div className={`relative rounded-lg border-2 bg-white shadow-md transition-all duration-200 ${
      selected ? `ring-2 ${style.ringColor} ring-offset-2` : 'hover:shadow-lg'
    }`} style={{ 
      borderColor: style.borderColor,
      minWidth: '220px'
    }}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: style.bgColor }}
          >
            <IconComponent 
              className="h-5 w-5" 
              style={{ color: style.iconColor }}
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">
              {data.config?.name || data.label}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              API Call
            </div>
          </div>
        </div>
        
        {data.config?.settings?.method && data.config?.settings?.url && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium" style={{
                backgroundColor: style.bgColor,
                color: style.iconColor
              }}>
                {data.config.settings.method}
              </span>
            </div>
            <div className="text-xs text-gray-600 truncate">
              {data.config.settings.url}
            </div>
          </div>
        )}

        {renderVariables(data.config?.settings?.inputVariables, 'input', style)}
        {renderVariables(data.config?.settings?.outputVariables, 'output', style)}
        
        {data.config?.description && (
          <div className="text-xs text-gray-600 mt-2 line-clamp-2">
            {data.config.description}
          </div>
        )}
      </div>
    </div>
  )
}

function EmailNode({ data, selected }: CustomNodeProps) {
  const style = nodeTypeStyles.email
  const IconComponent = nodeTypeIcons.email
  
  return (
    <div className={`relative rounded-lg border-2 bg-white shadow-md transition-all duration-200 ${
      selected ? `ring-2 ${style.ringColor} ring-offset-2` : 'hover:shadow-lg'
    }`} style={{ 
      borderColor: style.borderColor,
      minWidth: '180px'
    }}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: style.bgColor }}
          >
            <IconComponent 
              className="h-5 w-5" 
              style={{ color: style.iconColor }}
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">
              {data.config?.name || data.label}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Email
            </div>
          </div>
        </div>
        
        {data.config?.settings?.to && (
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              To: <span className="font-medium">{data.config.settings.to}</span>
            </div>
          </div>
        )}
        
        {data.config?.settings?.subject && (
          <div className="mt-1">
            <div className="text-xs text-gray-600 truncate">
              "{data.config.settings.subject}"
            </div>
          </div>
        )}
        
        {data.config?.description && (
          <div className="text-xs text-gray-600 mt-2 line-clamp-2">
            {data.config.description}
          </div>
        )}
      </div>
    </div>
  )
}

function WebhookNode({ data, selected }: CustomNodeProps) {
  const style = nodeTypeStyles.webhook
  const IconComponent = nodeTypeIcons.webhook
  
  return (
    <div className={`relative rounded-lg border-2 bg-white shadow-md transition-all duration-200 ${
      selected ? `ring-2 ${style.ringColor} ring-offset-2` : 'hover:shadow-lg'
    }`} style={{ 
      borderColor: style.borderColor,
      minWidth: '180px'
    }}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: style.bgColor }}
          >
            <IconComponent 
              className="h-5 w-5" 
              style={{ color: style.iconColor }}
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">
              {data.config?.name || data.label}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Webhook
            </div>
          </div>
        </div>
        
        {data.config?.settings?.url && (
          <div className="mt-2">
            <div className="text-xs text-gray-600 truncate">
              {data.config.settings.url}
            </div>
          </div>
        )}
        
        {data.config?.description && (
          <div className="text-xs text-gray-600 mt-2 line-clamp-2">
            {data.config.description}
          </div>
        )}
      </div>
    </div>
  )
}

function ConditionNode({ data, selected }: CustomNodeProps) {
  const style = nodeTypeStyles.condition
  const IconComponent = nodeTypeIcons.condition
  
  return (
    <div className={`relative rounded-lg border-2 bg-white shadow-md transition-all duration-200 ${
      selected ? `ring-2 ${style.ringColor} ring-offset-2` : 'hover:shadow-lg'
    }`} style={{ 
      borderColor: style.borderColor,
      minWidth: '180px'
    }}>
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: style.bgColor }}
          >
            <IconComponent 
              className="h-5 w-5" 
              style={{ color: style.iconColor }}
            />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">
              {data.config?.name || data.label}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Condition
            </div>
          </div>
        </div>
        
        {data.config?.settings?.conditionType === 'simple' && data.config?.settings?.field && (
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              {data.config.settings.field} {data.config.settings.operator || 'equals'} {data.config.settings.value}
            </div>
          </div>
        )}
        
        {data.config?.description && (
          <div className="text-xs text-gray-600 mt-2 line-clamp-2">
            {data.config.description}
          </div>
        )}
      </div>
    </div>
  )
}

// Define custom node types
export const customNodeTypes: NodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  api: ApiNode,
  email: EmailNode,
  webhook: WebhookNode,
  condition: ConditionNode,
} 