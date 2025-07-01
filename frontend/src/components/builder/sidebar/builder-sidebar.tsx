import { Sidebar, SidebarContent, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { ComponentPalette } from "../component-palette"
import { cn } from "@/lib/utils"

export function BuilderSidebar() {
  const { state } = useSidebar()

  return (
    <Sidebar 
      side="left" 
      variant="sidebar" 
      collapsible="icon"
      className={cn(
        "border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-all duration-300 ease-in-out"
      )}
    >
      <SidebarContent className="gap-0 p-0">    
        <ComponentPalette 
          onAddNode={() => {}}
          onDragStart={(e, nodeType, label) => {
            e.dataTransfer.setData('application/reactflow', nodeType);
            e.dataTransfer.setData('application/reactflow-label', label);
            e.dataTransfer.effectAllowed = 'move';
          }}
        />
      </SidebarContent>
    </Sidebar>
  )
}