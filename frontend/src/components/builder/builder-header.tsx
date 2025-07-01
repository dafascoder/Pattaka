import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Link } from '@tanstack/react-router'
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator, 
  BreadcrumbPage 
} from '../ui/breadcrumb'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  IconMenu2, 
  IconBug, 
  IconRotate2, 
  IconCloudUpload, 
  IconPlayerPlay, 
  IconHome,
  IconChevronDown,
  IconSettings,
  IconHistory,
  IconShare,
  IconLayoutGrid
} from '@tabler/icons-react'
import { useSidebar } from '../ui/sidebar'

interface BuilderHeaderProps {
  workflowName?: string
  lastSaved?: string
  onRun?: () => void
  onDebug?: () => void
  onRevert?: () => void
  onSave?: () => void
}

export function BuilderHeader({ 
  workflowName = "Untitled Workflow",
  lastSaved,
  onRun,
  onDebug,
  onRevert,
  onSave
}: BuilderHeaderProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <TooltipProvider>
      <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b shadow-sm">
        <div className="flex h-14 w-full items-center gap-4 px-4">
          {/* Sidebar Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-8 w-8"
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
              >
                <IconMenu2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle sidebar</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2">
            <IconLayoutGrid className="h-4 w-4" />
            <span>{workflowName}</span>
          </div>

          {/* Status indicator */}
          {lastSaved && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Last saved: {lastSaved}</span>
            </div>
          )}

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Primary Actions */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={onRun}
                    className="gap-2"
                  >   
                    <IconPlayerPlay size={16} />
                    Run
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Execute workflow</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onDebug}
                    className="gap-2"
                  >
                    <IconBug size={16} />
                    Debug
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Debug workflow execution</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Secondary Actions */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onSave}
                    className="gap-2"
                  >
                    <IconCloudUpload size={16} />
                    Save
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save workflow</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={onRevert}
                    className="gap-2"
                  >
                    <IconRotate2 size={16} />
                    Revert
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Revert changes</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <IconChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <IconHistory size={16} className="mr-2" />
                  Version History
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconShare size={16} className="mr-2" />
                  Share Workflow
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconSettings size={16} className="mr-2" />
                  Workflow Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
} 