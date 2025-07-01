import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { CreateWorkflowRequest, Workflow } from '@/types/api'

interface WorkflowCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (workflow: CreateWorkflowRequest) => Promise<Workflow>
  isCreating?: boolean
}

const initialWorkflow: CreateWorkflowRequest = {
  name: '',
  description: '',
  definition: {},
  is_active: true,
}

export function WorkflowCreateDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isCreating = false 
}: WorkflowCreateDialogProps) {
  const navigate = useNavigate()
  const [workflow, setWorkflow] = useState<CreateWorkflowRequest>(initialWorkflow)
  const [errors, setErrors] = useState<Partial<CreateWorkflowRequest>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateWorkflowRequest> = {}
    
    if (!workflow.name.trim()) {
      newErrors.name = 'Workflow name is required'
    } else if (workflow.name.length < 3) {
      newErrors.name = 'Workflow name must be at least 3 characters'
    }
    
    if (workflow.description && workflow.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    try {
      const newWorkflow = await onSubmit(workflow)
      setWorkflow(initialWorkflow)
      setErrors({})
      onOpenChange(false)
      toast.success('Workflow created! Opening builder...')
      
      // Navigate to builder with the new workflow ID
      navigate({ 
        to: '/builder', 
        search: { workflowId: newWorkflow.id } 
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create workflow')
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setWorkflow(initialWorkflow)
      setErrors({})
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
          <DialogDescription>
            Provide details for your workflow. You can edit the workflow graph later in the builder.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={workflow.name}
              onChange={(e) => {
                setWorkflow({ ...workflow, name: e.target.value })
                if (errors.name) setErrors({ ...errors, name: undefined })
              }}
              placeholder="Enter workflow name"
              className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={workflow.description}
              onChange={(e) => {
                setWorkflow({ ...workflow, description: e.target.value })
                if (errors.description) setErrors({ ...errors, description: undefined })
              }}
              placeholder="Describe what this workflow does"
              rows={3}
              className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {workflow.description?.length || 0}/500 characters
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={workflow.is_active}
              onCheckedChange={(checked) => 
                setWorkflow({ ...workflow, is_active: checked })
              }
            />
            <Label htmlFor="is_active" className="text-sm font-normal">
              Activate workflow immediately
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isCreating || !workflow.name.trim()}
            >
              {isCreating ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 