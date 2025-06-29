import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconChevronLeft, IconChevronRight, IconSearch, IconLighter, IconRobot, IconApi, IconMail, IconWebhook, IconGitBranch } from '@tabler/icons-react'

interface ComponentPaletteProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  onAddNode: (nodeType: string, label: string) => void
  onDragStart: (e: React.DragEvent, nodeType: string, label: string) => void
}

const nodeTypes = [
  {
    type: 'trigger',
    label: 'Trigger',
    icon: IconLighter,
    description: 'Start your workflow with various triggers',
    color: 'text-green-600 bg-green-50 border-green-200'
  },
  {
    type: 'agent',
    label: 'Agent',
    icon: IconRobot,
    description: 'AI agents that can process and respond',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    type: 'api',
    label: 'API Call',
    icon: IconApi,
    description: 'Make HTTP requests to external APIs',
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  },
  {
    type: 'email',
    label: 'Email',
    icon: IconMail,
    description: 'Send emails with custom content',
    color: 'text-orange-600 bg-orange-50 border-orange-200'
  },
  {
    type: 'webhook',
    label: 'Webhook',
    icon: IconWebhook,
    description: 'Send data to webhook endpoints',
    color: 'text-red-600 bg-red-50 border-red-200'
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: IconGitBranch,
    description: 'Add conditional logic to your workflow',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  }
]

export function ComponentPalette({ isCollapsed, onToggleCollapse, onAddNode, onDragStart }: ComponentPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredNodeTypes = nodeTypes.filter(nodeType =>
    nodeType.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nodeType.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-80'}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h2 className="font-semibold text-gray-900">Components</h2>}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <IconChevronRight className="h-4 w-4" /> : <IconChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        {!isCollapsed && (
          <div className="mt-4 relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        {!isCollapsed && (
          <p className="text-sm text-gray-600 mb-4">
            Drag components to the canvas or click to add at center
          </p>
        )}
        
        {filteredNodeTypes.map((nodeType) => {
          const IconComponent = nodeType.icon
          
          return (
            <Card
              key={nodeType.type}
              className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${nodeType.color} ${isCollapsed ? 'p-2' : ''}`}
              draggable
              onDragStart={(e) => onDragStart(e, nodeType.type, nodeType.label)}
              onClick={() => onAddNode(nodeType.type, nodeType.label)}
            >
              <CardHeader className={isCollapsed ? 'p-2' : 'pb-2'}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <IconComponent className={`h-5 w-5 ${nodeType.color.split(' ')[0]}`} />
                  {!isCollapsed && (
                    <div>
                      <CardTitle className="text-sm font-medium">{nodeType.label}</CardTitle>
                    </div>
                  )}
                </div>
              </CardHeader>
              {!isCollapsed && (
                <CardContent className="pt-0">
                  <CardDescription className="text-xs">{nodeType.description}</CardDescription>
                </CardContent>
              )}
            </Card>
          )
        })}
        
        {filteredNodeTypes.length === 0 && !isCollapsed && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No components match your search</p>
          </div>
        )}
      </div>
    </div>
  )
} 