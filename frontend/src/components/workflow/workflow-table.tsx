import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { IconTrash } from '@tabler/icons-react'
import { Workflow } from '@/types/api'

interface WorkflowTableProps {
  workflows?: Workflow[]
  isLoading?: boolean
  onDelete?: (workflowId: string) => void
}

export function WorkflowTable({ workflows = [], isLoading, onDelete }: WorkflowTableProps) {
  if (isLoading) {
    return <WorkflowTableSkeleton />
  }

  if (workflows.length === 0) {
    return <WorkflowEmptyState />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow List</CardTitle>
        <CardDescription>Your saved workflows</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell className="font-medium">{workflow.name}</TableCell>
                <TableCell className="text-muted-foreground max-w-[300px] truncate">
                  {workflow.description || 'No description'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={workflow.is_active ? 'default' : 'secondary'}
                    className={workflow.is_active ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>v{workflow.version}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link to="/builder" search={{ workflowId: workflow.id }}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onDelete(workflow.id)}
                    >
                      <IconTrash className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function WorkflowTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-48" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 pb-2 border-b">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
          
          {/* Table Rows */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-8" />
              <div className="flex gap-2 justify-end">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function WorkflowEmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow List</CardTitle>
        <CardDescription>Your saved workflows</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <IconTrash className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No workflows found</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Get started by creating your first workflow. You can automate tasks and build complex processes.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 