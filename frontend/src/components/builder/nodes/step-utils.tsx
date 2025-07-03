import React from 'react';
import {
  IconApi,
  IconBolt,
  IconCode,
  IconGitBranch,
  IconMail,
  IconRepeat,
  IconRobot,
  IconWebhook,
  IconClock,
  IconMouse,
  IconDatabase,
  IconCloud,
  IconMessage,
  IconFile,
  IconCalculator,
} from '@tabler/icons-react';

export function getStepIcon(stepType: string, pieceType?: string): React.ElementType {
  // First check for specific piece types
  if (pieceType) {
    switch (pieceType.toLowerCase()) {
      case 'http':
      case 'api':
        return IconApi;
      case 'email':
      case 'gmail':
      case 'outlook':
        return IconMail;
      case 'webhook':
        return IconWebhook;
      case 'database':
      case 'sql':
      case 'postgres':
      case 'mysql':
        return IconDatabase;
      case 'slack':
      case 'discord':
      case 'teams':
        return IconMessage;
      case 'file':
      case 'csv':
      case 'json':
        return IconFile;
      case 'openai':
      case 'anthropic':
      case 'llm':
        return IconRobot;
      case 'calculator':
      case 'math':
        return IconCalculator;
      case 'cloud':
      case 'aws':
      case 'gcp':
      case 'azure':
        return IconCloud;
      default:
        // Fall through to step type
        break;
    }
  }

  // Then check step types
  switch (stepType.toUpperCase()) {
    case 'TRIGGER':
      return IconBolt;
    case 'ACTION':
      return IconApi;
    case 'CODE':
      return IconCode;
    case 'LOOP':
      return IconRepeat;
    case 'ROUTER':
      return IconGitBranch;
    default:
      return IconBolt;
  }
}

export function getStepColor(stepType: string, pieceType?: string): string {
  // Color scheme based on step/piece type
  if (pieceType) {
    switch (pieceType.toLowerCase()) {
      case 'http':
      case 'api':
        return 'bg-purple-100 text-purple-700';
      case 'email':
      case 'gmail':
      case 'outlook':
        return 'bg-orange-100 text-orange-700';
      case 'webhook':
        return 'bg-pink-100 text-pink-700';
      case 'database':
      case 'sql':
      case 'postgres':
      case 'mysql':
        return 'bg-indigo-100 text-indigo-700';
      case 'slack':
      case 'discord':
      case 'teams':
        return 'bg-green-100 text-green-700';
      case 'file':
      case 'csv':
      case 'json':
        return 'bg-gray-100 text-gray-700';
      case 'openai':
      case 'anthropic':
      case 'llm':
        return 'bg-blue-100 text-blue-700';
      case 'calculator':
      case 'math':
        return 'bg-cyan-100 text-cyan-700';
      case 'cloud':
      case 'aws':
      case 'gcp':
      case 'azure':
        return 'bg-sky-100 text-sky-700';
      default:
        // Fall through to step type
        break;
    }
  }

  switch (stepType.toUpperCase()) {
    case 'TRIGGER':
      return 'bg-emerald-100 text-emerald-700';
    case 'ACTION':
      return 'bg-blue-100 text-blue-700';
    case 'CODE':
      return 'bg-slate-100 text-slate-700';
    case 'LOOP':
      return 'bg-amber-100 text-amber-700';
    case 'ROUTER':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getStepCategoryLabel(stepType: string): string {
  switch (stepType.toUpperCase()) {
    case 'TRIGGER':
      return 'Trigger';
    case 'ACTION':
      return 'Action';
    case 'CODE':
      return 'Code';
    case 'LOOP':
      return 'Flow Control';
    case 'ROUTER':
      return 'Flow Control';
    default:
      return 'Step';
  }
}

export function validateStepConfiguration(step: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic validation
  if (!step.name) {
    errors.push('Step name is required');
  }

  if (!step.displayName) {
    errors.push('Display name is required');
  }

  // Type-specific validation
  switch (step.type?.toUpperCase()) {
    case 'TRIGGER':
      if (!step.settings?.triggerType) {
        errors.push('Trigger type is required');
      }
      break;

    case 'ACTION':
      if (!step.settings?.pieceType) {
        errors.push('Action type is required');
      } else {
        // Piece-specific validation
        switch (step.settings.pieceType) {
          case 'http':
            if (!step.settings.url) {
              errors.push('URL is required for HTTP action');
            }
            if (!step.settings.method) {
              errors.push('HTTP method is required');
            }
            break;
          case 'email':
            if (!step.settings.to) {
              errors.push('Recipient email is required');
            }
            if (!step.settings.subject) {
              errors.push('Email subject is required');
            }
            break;
        }
      }
      break;

    case 'CODE':
      if (!step.settings?.code) {
        errors.push('Code is required');
      }
      break;

    case 'LOOP':
      if (!step.settings?.items) {
        errors.push('Items to loop over are required');
      }
      break;

    case 'ROUTER':
      if (!step.settings?.conditions || step.settings.conditions.length === 0) {
        errors.push('At least one condition is required');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getAvailablePieceTypes(): Array<{
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  color: string;
}> {
  return [
    // Communication
    {
      id: 'email',
      name: 'Email',
      description: 'Send emails via SMTP or email services',
      category: 'Communication',
      icon: IconMail,
      color: getStepColor('ACTION', 'email'),
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send messages to Slack channels',
      category: 'Communication',
      icon: IconMessage,
      color: getStepColor('ACTION', 'slack'),
    },
    
    // Data & APIs
    {
      id: 'http',
      name: 'HTTP Request',
      description: 'Make HTTP requests to external APIs',
      category: 'Data & APIs',
      icon: IconApi,
      color: getStepColor('ACTION', 'http'),
    },
    {
      id: 'database',
      name: 'Database',
      description: 'Query and modify database records',
      category: 'Data & APIs',
      icon: IconDatabase,
      color: getStepColor('ACTION', 'database'),
    },
    {
      id: 'webhook',
      name: 'Webhook',
      description: 'Receive HTTP webhooks from external services',
      category: 'Data & APIs',
      icon: IconWebhook,
      color: getStepColor('ACTION', 'webhook'),
    },
    
    // AI & Automation
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'Use OpenAI GPT models for text generation',
      category: 'AI & Automation',
      icon: IconRobot,
      color: getStepColor('ACTION', 'openai'),
    },
    
    // Files & Data
    {
      id: 'file',
      name: 'File Operations',
      description: 'Read, write, and process files',
      category: 'Files & Data',
      icon: IconFile,
      color: getStepColor('ACTION', 'file'),
    },
    
    // Utilities
    {
      id: 'calculator',
      name: 'Calculator',
      description: 'Perform mathematical calculations',
      category: 'Utilities',
      icon: IconCalculator,
      color: getStepColor('ACTION', 'calculator'),
    },
  ];
}

export function getAvailableTriggerTypes(): Array<{
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  settings: Record<string, any>;
}> {
  return [
    {
      id: 'manual',
      name: 'Manual Trigger',
      description: 'Manually start workflow execution',
      icon: IconMouse,
      settings: {},
    },
    {
      id: 'schedule',
      name: 'Schedule Trigger',
      description: 'Run workflow on a schedule',
      icon: IconClock,
      settings: {
        cronExpression: '0 9 * * *', // Daily at 9 AM
      },
    },
    {
      id: 'webhook',
      name: 'Webhook Trigger',
      description: 'Start workflow via HTTP webhook',
      icon: IconWebhook,
      settings: {
        path: '/webhook',
        method: 'POST',
      },
    },
  ];
} 