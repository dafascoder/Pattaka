import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Workflow, Plus, MousePointer2, Sparkles, ArrowRight } from "lucide-react"

export function BuilderEmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="max-w-lg w-full border-0 shadow-lg bg-background/95 backdrop-blur-sm">
        <div className="p-8 text-center space-y-6">
          {/* Animated Icon Group */}
          <div className="relative mx-auto w-fit">
            <div className="relative">
              {/* Main workflow icon */}
              <div className="bg-primary/10 p-6 rounded-full">
                <Workflow className="h-16 w-16 text-primary" />
              </div>
              
              {/* Floating accent icons */}
              <div className="absolute -top-2 -right-2 animate-bounce">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Sparkles className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              
              <div className="absolute -bottom-1 -left-2 animate-pulse delay-500">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Heading and Description */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">
              Ready to build your first flow?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Create powerful automated workflows by connecting different actions and triggers. 
              Start by dragging your first component onto the canvas.
            </p>
          </div>

          {/* Getting Started Steps */}
          <div className="space-y-4 text-left bg-muted/30 rounded-lg p-6">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Getting Started
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Choose a trigger</p>
                  <p className="text-xs text-muted-foreground">
                    Start your workflow with a webhook, schedule, or manual trigger
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Add actions</p>
                  <p className="text-xs text-muted-foreground">
                    Connect HTTP requests, emails, or custom logic steps
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Test and deploy</p>
                  <p className="text-xs text-muted-foreground">
                    Test your workflow and deploy it to start automation
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button className="flex-1 group">
              <MousePointer2 className="h-4 w-4 mr-2 group-hover:animate-pulse" />
              Drag a component to start
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Subtle hint */}
          <p className="text-xs text-muted-foreground/70">
            💡 Tip: Look for components in the sidebar on the left
          </p>
        </div>
      </Card>
    </div>
  )
}