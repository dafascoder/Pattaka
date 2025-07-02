import { IconGitBranch, IconPlayCard, IconRobot } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Workflow } from "@/types/api";

interface WorkflowStatsProps {
	workflows?: Workflow[];
	isLoading?: boolean;
}

export function WorkflowStats({
	workflows = [],
	isLoading,
}: WorkflowStatsProps) {
	const totalWorkflows = workflows.length;
	const activeWorkflows = workflows.filter((w) => w.is_active).length;
	const inactiveWorkflows = workflows.filter((w) => !w.is_active).length;

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Total Workflows</CardTitle>
					<IconGitBranch className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl">{totalWorkflows}</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Active</CardTitle>
					<IconPlayCard className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl text-green-600">
						{activeWorkflows}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="font-medium text-sm">Inactive</CardTitle>
					<IconRobot className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="font-bold text-2xl text-gray-600">
						{inactiveWorkflows}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
