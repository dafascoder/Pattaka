import { IconGripVertical, IconSearch } from "@tabler/icons-react";
import type { PaletteItem } from "@/components/builder/nodes/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
	useDragState,
	useFilteredPaletteItems,
	useHasTrigger,
	useSearchTerm,
	useSidebarExpanded,
	useWorkflowBuilderStore,
} from "@/stores/workflow-builder-store";

interface ComponentPaletteProps {
	onAddNode?: (nodeType: string, label: string, item?: PaletteItem) => void;
	onDragStart?: (
		e: React.DragEvent,
		nodeType: string,
		label: string,
		item?: PaletteItem
	) => void;
}

export function ComponentPalette({
	onAddNode,
	onDragStart,
}: ComponentPaletteProps) {
	const { state } = useSidebar();

	// Store selectors - these are safe and won't cause infinite loops
	const searchTerm = useSearchTerm();
	const dragState = useDragState();
	const hasTrigger = useHasTrigger();
	const filteredItems = useFilteredPaletteItems();

	// Store actions - get them directly to avoid re-render issues
	const setSearchTerm = useWorkflowBuilderStore((state) => state.setSearchTerm);
	const startDrag = useWorkflowBuilderStore((state) => state.startDrag);
	const endDrag = useWorkflowBuilderStore((state) => state.endDrag);
	const addNode = useWorkflowBuilderStore((state) => state.addNode);

	const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
		startDrag(item);

		// Set drag data for workflow builder
		e.dataTransfer.setData("application/reactflow", item.type);
		e.dataTransfer.setData("application/reactflow-label", item.name);
		e.dataTransfer.setData("application/reactflow-category", item.category);
		e.dataTransfer.effectAllowed = "move";

		// Call external handler if provided (for backward compatibility)
		if (onDragStart) {
			onDragStart(e, item.type, item.name, item);
		}
	};

	const handleDragEnd = () => {
		endDrag();
	};

	const handleAddNode = (
		item: PaletteItem,
		position?: { x: number; y: number }
	) => {
		const isDisabled = item.isDisabled?.(hasTrigger);
		if (isDisabled) return;

		// Use store action by default
		if (position) {
			addNode(item, position);
		}

		// Call external handler if provided (for backward compatibility)
		if (onAddNode) {
			onAddNode(item.type, item.name, item);
		}
	};

	const renderPaletteItem = (item: PaletteItem) => {
		const isDisabled = item.isDisabled?.(hasTrigger);
		const isDragging = dragState.draggedItemId === item.id;

		return (
			<SidebarMenuItem key={item.id}>
				<SidebarMenuButton
					className={cn(
						"group relative cursor-grab active:cursor-grabbing",
						"rounded-lg border border-transparent transition-all duration-200",
						"hover:border-border/60 hover:bg-muted/40 hover:shadow-sm",
						"focus:border-ring/40 focus:ring-2 focus:ring-ring/20",
						item.color && !isDisabled,
						isDisabled && "cursor-not-allowed bg-muted/20 opacity-50",
						isDragging && "scale-95 opacity-60 shadow-lg",
						state === "collapsed"
							? "h-10 w-10 justify-center p-2"
							: "h-auto p-3"
					)}
					disabled={isDisabled}
					draggable={!isDisabled}
					onClick={() => handleAddNode(item, { x: 100, y: 100 })}
					onDragEnd={handleDragEnd}
					onDragStart={(e) => {
						if (!isDisabled) {
							handleDragStart(e as any, item);
						}
					}}
					tooltip={
						state === "collapsed"
							? isDisabled && item.category === "triggers"
								? `${item.name} (Only one trigger allowed per workflow)`
								: item.name
							: undefined
					}
				>
					{state === "collapsed" ? (
						// Collapsed view - icon only
						<div
							className={cn(
								"flex-shrink-0 rounded-md p-1.5 transition-colors",
								!isDisabled && item.color
							)}
						>
							{item.icon}
						</div>
					) : (
						// Expanded view - full content
						<div className="flex w-full items-center gap-3">
							<div
								className={cn(
									"flex-shrink-0 rounded-md p-1.5 transition-colors",
									!isDisabled && item.color
								)}
							>
								{item.icon}
							</div>

							<div className="min-w-0 flex-1">
								<div className="flex items-center justify-between">
									<span className="truncate font-medium text-sm">
										{item.name}
									</span>
									<IconGripVertical className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/70" />
								</div>
								<p className="mt-0.5 line-clamp-2 text-muted-foreground/70 text-xs">
									{item.description}
								</p>
								{item.category === "triggers" && (
									<Badge
										className="mt-1.5 h-5 text-xs"
										variant={isDisabled ? "destructive" : "secondary"}
									>
										{isDisabled ? "Trigger (Disabled)" : "Trigger"}
									</Badge>
								)}
								{item.type === "agent" && (
									<Badge
										className="mt-1.5 h-5 bg-blue-100 text-blue-700 text-xs"
										variant="secondary"
									>
										AI Agent
									</Badge>
								)}
								{item.config?.requiredFields &&
									item.config.requiredFields.length > 0 && (
										<Badge className="mt-1.5 h-5 text-xs" variant="outline">
											{item.config.requiredFields.length} required
										</Badge>
									)}
							</div>
						</div>
					)}
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	};

	const renderSection = (title: string, items: PaletteItem[], show = true) => {
		if (!show || items.length === 0) return null;

		return (
			<SidebarGroup
				className={cn(
					"border-border/20 border-t px-2 first:border-t-0",
					state === "expanded" ? "py-3" : "py-2"
				)}
			>
				{state === "expanded" && (
					<SidebarGroupLabel className="px-2 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
						{title}
						{items.length > 0 && (
							<Badge className="ml-2 h-4 px-1.5 text-xs" variant="secondary">
								{items.length}
							</Badge>
						)}
					</SidebarGroupLabel>
				)}
				<SidebarGroupContent
					className={cn(state === "expanded" ? "mt-2" : "mt-0")}
				>
					<SidebarMenu
						className={cn(state === "expanded" ? "space-y-1" : "space-y-0.5")}
					>
						{items.map(renderPaletteItem)}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		);
	};

	const hasResults =
		filteredItems.triggers.length > 0 ||
		filteredItems.actions.length > 0 ||
		filteredItems.logic.length > 0 ||
		filteredItems.agents.length > 0;

	return (
		<div className="flex h-full flex-col">
			{/* Enhanced Search Header - Only show when expanded */}
			{state === "expanded" && (
				<SidebarHeader className="border-border/40 border-b bg-muted/30 px-4 py-3">
					<div className="relative">
						<IconSearch className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
						<Input
							className={cn(
								"h-9 border-border/40 bg-background/50 pl-10",
								"transition-colors duration-200 focus:border-ring focus:bg-background",
								"placeholder:text-muted-foreground/70"
							)}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search components..."
							value={searchTerm}
						/>
						{searchTerm && (
							<Button
								className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7 transform p-0 hover:bg-muted"
								onClick={() => setSearchTerm("")}
								size="sm"
								variant="ghost"
							>
								×
							</Button>
						)}
					</div>

					{/* Search Results Summary */}
					{searchTerm && (
						<div className="mt-2 text-muted-foreground/70 text-xs">
							{hasResults ? (
								<span>
									Found{" "}
									{filteredItems.triggers.length +
										filteredItems.actions.length +
										filteredItems.logic.length +
										filteredItems.agents.length}{" "}
									components
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
				{dragState.isDragging && state === "expanded" && (
					<div className="border-blue-200 border-b bg-blue-50 px-4 py-2 text-blue-700 text-xs">
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
							Dragging: {dragState.draggedItem?.name}
						</div>
					</div>
				)}

				{/* Render sections */}
				{renderSection("Triggers", filteredItems.triggers)}
				{renderSection("Actions", filteredItems.actions)}
				{renderSection("Logic", filteredItems.logic)}
				{renderSection(
					"Agents",
					filteredItems.agents,
					filteredItems.agents.length > 0
				)}

				{/* Enhanced Empty State - Only show when expanded */}
				{searchTerm && !hasResults && state === "expanded" && (
					<div className="flex flex-col items-center justify-center px-4 py-12 text-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
							<IconSearch className="h-6 w-6 text-muted-foreground/50" />
						</div>
						<h3 className="mb-1 font-medium text-foreground text-sm">
							No components found
						</h3>
						<p className="max-w-[200px] text-muted-foreground/70 text-xs">
							Try adjusting your search terms or browse all components
						</p>
						<Button
							className="mt-3 h-7 text-xs"
							onClick={() => setSearchTerm("")}
							size="sm"
							variant="ghost"
						>
							Clear search
						</Button>
					</div>
				)}

				{/* Usage Hint - Only show when expanded and no search */}
				{state === "expanded" && !searchTerm && (
					<div className="border-border/20 border-t bg-muted/20 px-4 py-3">
						<div className="space-y-1 text-center text-muted-foreground/70 text-xs">
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
				{process.env.NODE_ENV === "development" && state === "expanded" && (
					<div className="border-border/10 border-t bg-muted/10 px-4 py-2">
						<details className="text-muted-foreground/50 text-xs">
							<summary className="cursor-pointer hover:text-muted-foreground/70">
								Debug Info
							</summary>
							<div className="mt-2 space-y-1">
								<div>Has Trigger: {hasTrigger ? "Yes" : "No"}</div>
								<div>
									Dragging:{" "}
									{dragState.isDragging ? dragState.draggedItem?.name : "None"}
								</div>
								<div>Search: "{searchTerm}"</div>
								<div>
									Results: T:{filteredItems.triggers.length} A:
									{filteredItems.actions.length} L:{filteredItems.logic.length}{" "}
									Ag:{filteredItems.agents.length}
								</div>
							</div>
						</details>
					</div>
				)}
			</div>
		</div>
	);
}
