import React, { memo, ReactNode } from "react"
import { IconGitBranch, IconLighter, IconMail, IconRobot } from "@tabler/icons-react"
import { IconApi, IconWebhook, IconPlayerPlay, IconClock, IconCloudUpload, IconCode } from "@tabler/icons-react"
import { Connection, Edge } from "@xyflow/react"

export type NodeType = 'trigger' | 'agent' | 'api' | 'email' | 'webhook' | 'condition' | 'default' | 'function' | 'action'

export type TriggerType = 'manual' | 'scheduled' | 'webhook'
export type ActionType = 'http' | 'log' | 'email' | 'agent'

interface Variable {
    name: string
    type: 'string' | 'number' | 'boolean' | 'object' | 'array'
}

export interface Node {
    id: string
    type: NodeType
    data: {
        label: string
        nodeType: NodeType
        subType?: TriggerType | ActionType
    }
    className?: string
    style?: React.CSSProperties
    position?: {
        x: number
        y: number
    }
    selected?: boolean
    dragging?: boolean
    draggable?: boolean
    config?: {
        name?: string
        description?: string
        settings?: Record<string, any>
    }
    inputs?: Variable[]
    outputs?: Variable[]
    edges?: Edge[]
    connections?: Connection[]
}

export interface PaletteItem {
    id: string
    name: string
    type: NodeType
    subType?: TriggerType | ActionType
    icon: ReactNode
    description: string
    color: string
    category: 'triggers' | 'actions' | 'logic' | 'integrations'
    isDisabled?: (hasTrigger: boolean) => boolean
    config?: {
        defaultSettings?: Record<string, any>
        requiredFields?: string[]
        optionalFields?: string[]
    }
}

export interface Agent {
    id: string
    name: string
    description?: string
    type?: string
}

// Predefined palette items with complete configuration
export const PALETTE_ITEMS: PaletteItem[] = [
    // Triggers
    {
        id: 'manual-trigger',
        name: 'Manual Trigger',
        type: 'trigger',
        subType: 'manual',
        icon: <IconPlayerPlay className="h-5 w-5" />,
        description: 'Trigger workflow manually with a button click.',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
        category: 'triggers',
        isDisabled: (hasTrigger) => hasTrigger,
        config: {
            defaultSettings: {
                buttonText: 'Run Workflow',
                confirmRequired: false
            },
            optionalFields: ['buttonText', 'confirmRequired', 'description']
        }
    },
    {
        id: 'scheduled-trigger',
        name: 'Scheduled Trigger',
        type: 'trigger',
        subType: 'scheduled',
        icon: <IconClock className="h-5 w-5" />,
        description: 'Trigger workflow on a schedule using cron expressions.',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
        category: 'triggers',
        isDisabled: (hasTrigger) => hasTrigger,
        config: {
            defaultSettings: {
                schedule: '0 9 * * 1', // Every Monday at 9 AM
                timezone: 'UTC'
            },
            requiredFields: ['schedule'],
            optionalFields: ['timezone', 'description']
        }
    },
    {
        id: 'webhook-trigger',
        name: 'Webhook Trigger',
        type: 'trigger',
        subType: 'webhook',
        icon: <IconWebhook className="h-5 w-5" />,
        description: 'Trigger workflow via HTTP webhook endpoint.',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
        category: 'triggers',
        isDisabled: (hasTrigger) => hasTrigger,
        config: {
            defaultSettings: {
                method: 'POST',
                authentication: 'none'
            },
            optionalFields: ['method', 'authentication', 'headers']
        }
    },
    
    // Actions
    {
        id: 'http-action',
        name: 'HTTP Request',
        type: 'action',
        subType: 'http',
        icon: <IconCloudUpload className="h-5 w-5" />,
        description: 'Make HTTP requests to external APIs and services.',
        color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100',
        category: 'actions',
        config: {
            defaultSettings: {
                method: 'GET',
                timeout: 30000
            },
            requiredFields: ['url', 'method'],
            optionalFields: ['headers', 'body', 'timeout', 'authentication']
        }
    },
    {
        id: 'log-action',
        name: 'Log Message',
        type: 'action',
        subType: 'log',
        icon: <IconCode className="h-5 w-5" />,
        description: 'Log messages for debugging and monitoring workflows.',
        color: 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100',
        category: 'actions',
        config: {
            defaultSettings: {
                level: 'info'
            },
            requiredFields: ['message'],
            optionalFields: ['level', 'data']
        }
    },
    {
        id: 'email-action',
        name: 'Send Email',
        type: 'email',
        icon: <IconMail className="h-5 w-5" />,
        description: 'Send emails with custom content and attachments.',
        color: 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100',
        category: 'actions',
        config: {
            requiredFields: ['to', 'subject', 'body'],
            optionalFields: ['from', 'cc', 'bcc', 'attachments', 'template']
        }
    },

    // Logic
    {
        id: 'condition',
        name: 'Condition',
        type: 'condition',
        icon: <IconGitBranch className="h-5 w-5" />,
        description: 'Add conditional branching logic to your workflow.',
        color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100',
        category: 'logic',
        config: {
            requiredFields: ['condition'],
            optionalFields: ['trueLabel', 'falseLabel']
        }
    }
]

// Utility functions for working with palette items
export function getPaletteItemById(id: string): PaletteItem | undefined {
    return PALETTE_ITEMS.find(item => item.id === id)
}

export function getPaletteItemsByCategory(category: PaletteItem['category']): PaletteItem[] {
    return PALETTE_ITEMS.filter(item => item.category === category)
}

export function createAgentPaletteItem(agent: Agent): PaletteItem {
    return {
        id: `agent-${agent.id}`,
        name: agent.name,
        type: 'agent',
        icon: <IconRobot className="h-5 w-5" />,
        description: agent.description || 'AI agent that can process and respond to inputs.',
        color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100',
        category: 'actions',
        config: {
            defaultSettings: {
                agentId: agent.id,
                timeout: 60000
            },
            requiredFields: ['prompt'],
            optionalFields: ['context', 'temperature', 'maxTokens']
        }
    }
}

export function createNodeFromPaletteItem(
    paletteItem: PaletteItem, 
    position: { x: number; y: number }
): Omit<Node, 'id'> {
    return {
        type: paletteItem.type,
        data: {
            label: paletteItem.name,
            nodeType: paletteItem.type,
            subType: paletteItem.subType
        },
        position,
        config: {
            name: paletteItem.name,
            description: paletteItem.description,
            settings: paletteItem.config?.defaultSettings || {}
        },
        draggable: true
    }
} 