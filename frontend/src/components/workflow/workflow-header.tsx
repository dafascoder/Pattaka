import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { IconPlus } from '@tabler/icons-react'

interface WorkflowHeaderProps {
  onCreateClick: () => void
}

export function WorkflowHeader({ onCreateClick }: WorkflowHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
        <p className="text-muted-foreground">
          Manage and monitor your automation workflows
        </p>
      </div>
      <Button onClick={onCreateClick}>
        <IconPlus className="mr-2 h-4 w-4" />
        New Workflow
      </Button>
    </div>
  )
} 