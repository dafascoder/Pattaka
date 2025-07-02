import { IconTrash } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Workflow } from "@/types/api";

interface WorkflowTableProps {
	workflows?: Workflow[];
	isLoading?: boolean;
	onDelete?: (workflowId: string) => void;
}

export function WorkflowTable({
	workflows = [],
	isLoading,
	onDelete,
}: WorkflowTableProps) {
	if (isLoading) {
		return <WorkflowTableSkeleton />;
	}

	if (workflows.length === 0) {
		return <WorkflowEmptyState />;
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
								<TableCell className="max-w-[300px] truncate text-muted-foreground">
									{workflow.description || "No description"}
								</TableCell>
								<TableCell>
									<Badge
										className={
											workflow.is_active
												? "bg-green-500 hover:bg-green-600"
												: ""
										}
										variant={workflow.is_active ? "default" : "secondary"}
									>
										{workflow.is_active ? "Active" : "Inactive"}
									</Badge>
								</TableCell>
								<TableCell>v{workflow.version}</TableCell>
								<TableCell className="space-x-2 text-right">
									<Link search={{ workflowId: workflow.id }} to="/builder">
										<Button size="sm" variant="outline">
											Edit
										</Button>
									</Link>
									{onDelete && (
										<Button
											className="text-red-600 hover:bg-red-50 hover:text-red-700"
											onClick={() => onDelete(workflow.id)}
											size="sm"
											variant="outline"
										>
											<IconTrash className="mr-1 h-3 w-3" />
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
	);
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
					<div className="grid grid-cols-5 gap-4 border-b pb-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-4 w-14" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="ml-auto h-4 w-16" />
					</div>

					{/* Table Rows */}
					{[...Array(3)].map((_, i) => (
						<div className="grid grid-cols-5 gap-4 py-3" key={i}>
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-40" />
							<Skeleton className="h-6 w-16 rounded-full" />
							<Skeleton className="h-4 w-8" />
							<div className="flex justify-end gap-2">
								<Skeleton className="h-8 w-12" />
								<Skeleton className="h-8 w-16" />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
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
					<div className="mb-4 rounded-full bg-muted p-4">
						<IconTrash className="h-8 w-8 text-muted-foreground" />
					</div>
					<h3 className="mb-2 font-semibold text-lg">No workflows found</h3>
					<p className="mb-4 max-w-sm text-muted-foreground">
						Get started by creating your first workflow. You can automate tasks
						and build complex processes.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
