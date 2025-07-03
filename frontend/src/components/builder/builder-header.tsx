import {
	IconBug,
	IconChevronDown,
	IconChevronLeft,
	IconCloudUpload,
	IconHistory,
	IconHome,
	IconLayoutGrid,
	IconMenu2,
	IconPlayerPlay,
	IconRotate2,
	IconSettings,
	IconShare,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "../ui/breadcrumb";

interface BuilderHeaderProps {
	workflowId?: string;
	workflowName?: string;
	lastSaved?: string;
	onRun?: () => void;
	onDebug?: () => void;
	onRevert?: () => void;
	onSave?: () => void;
}

export function BuilderHeader({
	workflowId,
	workflowName = "Untitled Workflow",
	lastSaved,
	onRun,
	onDebug,
	onRevert,
	onSave,
}: BuilderHeaderProps) {
	const [isDebugOpen, setIsDebugOpen] = useState(false);
	const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
		null
	);

	return (
		<TooltipProvider>
			<header className="sticky top-0 z-50 flex w-full items-center border-b bg-background shadow-sm">
				<div className="flex h-14 w-full items-center gap-4 px-4">
					<div className="flex items-center gap-2">
						<Link
							className={buttonVariants({ variant: "ghost", size: "sm" })}
							to="/dashboard/projects"
						>
							<IconChevronLeft size={16} />
						</Link>
						<span>{workflowName}</span>
					</div>

					{/* Status indicator */}
					{lastSaved && (
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
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
										className="gap-2"
										onClick={onRun}
										size="sm"
										variant="default"
									>
										<IconPlayerPlay size={16} />
										Run
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Execute workflow</p>
								</TooltipContent>
							</Tooltip>

						</div>

						<Separator className="h-6" orientation="vertical" />

						{/* Secondary Actions */}
						<div className="flex items-center gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										className="gap-2"
										onClick={onSave}
										size="sm"
										variant="ghost"
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
										className="gap-2"
										onClick={onRevert}
										size="sm"
										variant="ghost"
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

						<Separator className="h-6" orientation="vertical" />

						{/* More Actions Dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size="sm" variant="ghost">
									<IconChevronDown size={16} />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>
									<IconHistory className="mr-2" size={16} />
									Version History
								</DropdownMenuItem>
								<DropdownMenuItem>
									<IconShare className="mr-2" size={16} />
									Share Workflow
								</DropdownMenuItem>
								<DropdownMenuItem>
									<IconSettings className="mr-2" size={16} />
									Workflow Settings
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</header>
		</TooltipProvider>
	);
}
