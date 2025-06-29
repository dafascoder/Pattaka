import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IconExternalLink, IconRocket, IconWand } from '@tabler/icons-react'

export const Route = createFileRoute('/(authenticated)/dashboard/_layout/builder')({
  component: BuilderRedirect,
})

function BuilderRedirect() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workflow Builder</h1>
        <p className="text-muted-foreground">
          Design and create powerful automation workflows for your agents
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconWand className="h-5 w-5 text-primary" />
              <CardTitle>Visual Builder</CardTitle>
            </div>
            <CardDescription>
              Create workflows using our intuitive drag-and-drop interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/builder">
              <Button className="w-full">
                Open Builder
                <IconExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconRocket className="h-5 w-5 text-orange-500" />
              <CardTitle>Quick Start</CardTitle>
            </div>
            <CardDescription>
              Get started with pre-built workflow templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Browse Templates
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconExternalLink className="h-5 w-5 text-blue-500" />
              <CardTitle>Import Workflow</CardTitle>
            </div>
            <CardDescription>
              Import existing workflows from files or other sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" disabled>
              Import Workflow
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-2">Why use the dedicated builder?</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Full-screen canvas for complex workflows</li>
          <li>• Better performance with large diagrams</li>
          <li>• Advanced controls and minimap</li>
          <li>• Collapsible component palette</li>
          <li>• Real-time drag and drop functionality</li>
        </ul>
      </div>
    </div>
  )
} 