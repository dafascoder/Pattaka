import {
	Sidebar,
	SidebarContent,
	SidebarInset,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ComponentPalette } from "../component-palette";

export function BuilderSidebar() {
	const { state } = useSidebar();

	return (
		<Sidebar
			className={cn(
				"border-border/40 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
				"transition-all duration-300 ease-in-out"
			)}
			collapsible="icon"
			side="left"
			variant="sidebar"
		>
			<SidebarContent className="gap-0 p-0">
				<ComponentPalette
					onAddNode={() => {}}
					onDragStart={(e, nodeType, label) => {
						e.dataTransfer.setData("application/reactflow", nodeType);
						e.dataTransfer.setData("application/reactflow-label", label);
						e.dataTransfer.effectAllowed = "move";
					}}
				/>
			</SidebarContent>
		</Sidebar>
	);
}
