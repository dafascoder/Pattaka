import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Loader2, Workflow, Zap } from "lucide-react"

export function BuilderLoading() {
  return (
    <div className="flex h-screen w-full">
      {/* Main Canvas Loading */}
      <div className="flex-1 flex flex-col">

        {/* Canvas Area */}
        <div className="flex-1 bg-muted/20 relative overflow-hidden">
          {/* Central Loading Animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-8 shadow-lg border-0 bg-background/95 backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-6">
                {/* Animated Icons */}
                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="animate-pulse">
                      <Workflow className="h-12 w-12 text-primary" />
                    </div>
                    <div className="animate-bounce delay-150">
                      <Zap className="h-8 w-8 text-yellow-500" />
                    </div>
                  </div>
                </div>

                {/* Loading Text */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight">
                    Loading Workflow Builder
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Preparing your canvas and components...
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Setting up workspace</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: '85%' }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Background Node Skeletons */}
          <div className="absolute inset-0 opacity-30">
            {/* Scattered skeleton nodes to simulate workflow layout */}
            <div className="absolute top-20 left-20">
              <Skeleton className="h-16 w-48 rounded-lg" />
            </div>
            <div className="absolute top-40 right-32">
              <Skeleton className="h-20 w-32 rounded-lg" />
            </div>
            <div className="absolute bottom-32 left-40">
              <Skeleton className="h-12 w-40 rounded-lg" />
            </div>
            <div className="absolute bottom-20 right-20">
              <Skeleton className="h-16 w-36 rounded-lg" />
            </div>
            
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
