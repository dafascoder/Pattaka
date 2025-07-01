import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { IconSearch, IconGripVertical } from '@tabler/icons-react'
import { 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { type PaletteItem } from './nodes/node-types'
import { 
  useWorkflowBuilderStore,
  useSearchTerm,
  useDragState,
  useHasTrigger,
  useSidebarExpanded,
  useFilteredPaletteItems
} from '@/stores/workflow-builder-store'

interface ComponentPaletteProps {
  onAddNode?: (nodeType: string, label: string, item?: PaletteItem) => void
  onDragStart?: (e: React.DragEvent, nodeType: string, label: string, item?: PaletteItem) => void
}

export function ComponentPalette({ onAddNode, onDragStart }: ComponentPaletteProps) {
  const { state } = useSidebar()
  
  // Store selectors - these are safe and won't cause infinite loops
  const searchTerm = useSearchTerm()
  const dragState = useDragState()
  const hasTrigger = useHasTrigger()
  const filteredItems = useFilteredPaletteItems()
  
  // Store actions - get them directly to avoid re-render issues
  const setSearchTerm = useWorkflowBuilderStore(state => state.setSearchTerm)
  const startDrag = useWorkflowBuilderStore(state => state.startDrag)
  const endDrag = useWorkflowBuilderStore(state => state.endDrag)
  const addNode = useWorkflowBuilderStore(state => state.addNode)

  const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
    startDrag(item)
    
    // Call external handler if provided (for backward compatibility)
    if (onDragStart) {
      onDragStart(e, item.type, item.name, item)
    }
  }

  const handleDragEnd = () => {
    endDrag()
  }

  const handleAddNode = (item: PaletteItem, position?: { x: number; y: number }) => {
    const isDisabled = item.isDisabled?.(hasTrigger) || false
    if (isDisabled) return
    
    // Use store action by default
    if (position) {
      addNode(item, position)
    }
    
    // Call external handler if provided (for backward compatibility)
    if (onAddNode) {
      onAddNode(item.type, item.name, item)
    }
  }

  const renderPaletteItem = (item: PaletteItem) => {
    const isDisabled = item.isDisabled?.(hasTrigger) || false
    const isDragging = dragState.draggedItemId === item.id
    
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          onClick={() => handleAddNode(item, { x: 100, y: 100 })}
          disabled={isDisabled}
          className={cn(
            "group relative cursor-grab active:cursor-grabbing",
            "border border-transparent rounded-lg transition-all duration-200",
            "hover:border-border/60 hover:bg-muted/40 hover:shadow-sm",
            "focus:ring-2 focus:ring-ring/20 focus:border-ring/40",
            item.color && !isDisabled,
            isDisabled && "opacity-50 cursor-not-allowed bg-muted/20",
            isDragging && "opacity-60 scale-95 shadow-lg",
            state === 'collapsed' ? "h-10 w-10 p-2 justify-center" : "h-auto p-3"
          )}
          draggable={!isDisabled}
          onDragStart={(e) => {
            if (!isDisabled) {
              handleDragStart(e as any, item)
            }
          }}
          onDragEnd={handleDragEnd}
          tooltip={state === 'collapsed' ? item.name : undefined}
        >
          {state === 'collapsed' ? (
            // Collapsed view - icon only
            <div className={cn(
              "flex-shrink-0 p-1.5 rounded-md transition-colors",
              !isDisabled && item.color
            )}>
              {item.icon}
            </div>
          ) : (
            // Expanded view - full content
            <div className="flex items-center gap-3 w-full">
              <div className={cn(
                "flex-shrink-0 p-1.5 rounded-md transition-colors",
                !isDisabled && item.color
              )}>
                {item.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">
                    {item.name}
                  </span>
                  <IconGripVertical className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-0.5">
                  {item.description}
                </p>
                {item.category === 'triggers' && (
                  <Badge variant="secondary" className="mt-1.5 text-xs h-5">
                    Trigger
                  </Badge>
                )}
                {item.type === 'agent' && (
                  <Badge variant="secondary" className="mt-1.5 text-xs h-5 bg-blue-100 text-blue-700">
                    AI Agent
                  </Badge>
                )}
                {item.config?.requiredFields && item.config.requiredFields.length > 0 && (
                  <Badge variant="outline" className="mt-1.5 text-xs h-5">
                    {item.config.requiredFields.length} required
                  </Badge>
                )}
              </div>
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const renderSection = (title: string, items: PaletteItem[], show: boolean = true) => {
    if (!show || items.length === 0) return null

    return (
      <SidebarGroup className={cn(
        "px-2 border-t border-border/20 first:border-t-0",
        state === 'expanded' ? "py-3" : "py-2"
      )}>
        {state === 'expanded' && (
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
            {title}
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs h-4 px-1.5">
                {items.length}
              </Badge>
            )}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent className={cn(state === 'expanded' ? "mt-2" : "mt-0")}>
          <SidebarMenu className={cn(state === 'expanded' ? "space-y-1" : "space-y-0.5")}>
            {items.map(renderPaletteItem)}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  const hasResults = filteredItems.triggers.length > 0 || 
                   filteredItems.actions.length > 0 || 
                   filteredItems.logic.length > 0 || 
                   filteredItems.agents.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Enhanced Search Header - Only show when expanded */}
      {state === 'expanded' && (
        <SidebarHeader className="px-4 py-3 border-b border-border/40 bg-muted/30"> 
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "pl-10 h-9 bg-background/50 border-border/40",
                "focus:bg-background focus:border-ring transition-colors duration-200",
                "placeholder:text-muted-foreground/70"
              )}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                onClick={() => setSearchTerm('')}
              >
                ×
              </Button>
            )}
          </div>
          
          {/* Search Results Summary */}
          {searchTerm && (
            <div className="mt-2 text-xs text-muted-foreground/70">
              {hasResults ? (
                <span>
                  Found {filteredItems.triggers.length + filteredItems.actions.length + 
                         filteredItems.logic.length + filteredItems.agents.length} components
                </span>
              ) : (
                <span>No components found</span>
              )}
            </div>
          )}
        </SidebarHeader>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Show drag indicator when dragging */}
        {dragState.isDragging && state === 'expanded' && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-blue-700 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Dragging: {dragState.draggedItem?.name}
            </div>
          </div>
        )}

        {/* Render sections */}
        {renderSection('Triggers', filteredItems.triggers)}
        {renderSection('Actions', filteredItems.actions)}
        {renderSection('Logic', filteredItems.logic)}
        {renderSection('Agents', filteredItems.agents, filteredItems.agents.length > 0)}

        {/* Enhanced Empty State - Only show when expanded */}
        {searchTerm && !hasResults && state === 'expanded' && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <IconSearch className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <h3 className="font-medium text-sm text-foreground mb-1">No components found</h3>
            <p className="text-xs text-muted-foreground/70 max-w-[200px]">
              Try adjusting your search terms or browse all components
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-3 text-xs h-7"
              onClick={() => setSearchTerm('')}
            >
              Clear search
            </Button>
          </div>
        )}

        {/* Usage Hint - Only show when expanded and no search */}
        {state === 'expanded' && !searchTerm && (
          <div className="px-4 py-3 border-t border-border/20 bg-muted/20">
            <div className="text-xs text-muted-foreground/70 text-center space-y-1">
              <p>Drag components to add them to your workflow</p>
              {hasTrigger && (
                <p className="text-amber-600">
                  ⚠️ Only one trigger per workflow
                </p>
              )}
            </div>
          </div>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && state === 'expanded' && (
          <div className="px-4 py-2 border-t border-border/10 bg-muted/10">
            <details className="text-xs text-muted-foreground/50">
              <summary className="cursor-pointer hover:text-muted-foreground/70">
                Debug Info
              </summary>
              <div className="mt-2 space-y-1">
                <div>Has Trigger: {hasTrigger ? 'Yes' : 'No'}</div>
                <div>Dragging: {dragState.isDragging ? dragState.draggedItem?.name : 'None'}</div>
                <div>Search: "{searchTerm}"</div>
                <div>Results: T:{filteredItems.triggers.length} A:{filteredItems.actions.length} L:{filteredItems.logic.length} Ag:{filteredItems.agents.length}</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
} 