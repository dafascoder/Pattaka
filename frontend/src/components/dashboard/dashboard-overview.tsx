import {
	Activity,
	Loader2,
	RefreshCw,
	Users,
	Workflow,
	Zap,
} from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAgents } from "@/hooks/useAgent";
import type { Agent } from "@/types/api";

interface DashboardOverviewProps {
	agents: Agent[];
	agentsLoading: boolean;
}

export function DashboardOverview({
	agents,
	agentsLoading,
}: DashboardOverviewProps) {
	return (
		<div className="space-y-6">
			{/* Welcome Section */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Dashboard</h1>
					<p className="mt-2 text-muted-foreground">Welcome to Pattaka!</p>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Agents</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{agentsLoading ? (
							<div className="flex items-center">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								<span>Loading...</span>
							</div>
						) : (
							<>
								<div className="font-bold text-2xl">{agents?.length || 0}</div>
								<p className="text-muted-foreground text-xs">0 active</p>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
				<Card className="lg:col-span-4">
					<CardHeader>
						<CardTitle>Recent Agents</CardTitle>
						<CardDescription>Your recently created AI agents</CardDescription>
					</CardHeader>
					<CardContent>
						{agentsLoading ? (
							<div className="flex items-center justify-center p-4">
								<Loader2 className="mr-2 h-6 w-6 animate-spin" />
								<span>Loading agents...</span>
							</div>
						) : agents && agents.length > 0 ? (
							<div className="space-y-4">
								{agents.slice(0, 5).map((agent) => (
									<div
										className="flex items-center justify-between"
										key={agent.id}
									>
										<div>
											<p className="font-medium">{agent.name}</p>
											<p className="text-muted-foreground text-sm">
												{agent.description || "No description"}
											</p>
										</div>
										<Badge
											variant={
												agent.status === "active" ? "default" : "secondary"
											}
										>
											{agent.status}
										</Badge>
									</div>
								))}
							</div>
						) : (
							<div className="py-6 text-center">
								<p className="text-muted-foreground">No agents created yet</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<Card>
				<CardHeader>
					<CardTitle>Quick Actions</CardTitle>
					<CardDescription>Common tasks to get you started</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-4">
						<Button>Create New Agent</Button>
						<Button variant="outline">Build Workflow</Button>
						<Button variant="outline">Add Integration</Button>
						<Button variant="outline">View Analytics</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
