import {
	Activity,
	BarChart3,
	Building2,
	Clock,
	Database,
	GitBranch,
	Loader2,
	Play,
	Plus,
	RefreshCw,
	Settings,
	TrendingUp,
	Users,
	Workflow,
	Zap,
} from "lucide-react";
import React, { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ProjectCreateDialog } from "@/components/project";
import { projectService } from "@/services/project-service";
import { toast } from "sonner";
import type { Agent, Project } from "@/types/api";

interface DashboardOverviewProps {
	agents?: Agent[];
	projects?: Project[];
	loading?: boolean;
}

export function DashboardOverview({
	agents = [],
	projects = [],
	loading = false,
}: DashboardOverviewProps) {
	const [createProjectOpen, setCreateProjectOpen] = useState(false);
	
	// Calculate statistics
	const stats = {
		totalProjects: projects.length,
		totalAgents: agents.length,
		activeAgents: agents.filter(agent => agent.status === 'active').length,
		recentProjects: projects.slice(0, 3),
		recentAgents: agents.slice(0, 5),
	};

	const handleCreateProject = async (projectData: any) => {
		try {
			const newProject = await projectService.createProject(projectData);
			toast.success("Project created successfully!");
			// Refresh the projects list would typically be handled by a query invalidation
			return newProject;
		} catch (error) {
			toast.error("Failed to create project");
			throw error;
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<h2 className="text-xl font-semibold mb-2">Loading Dashboard</h2>
					<p className="text-muted-foreground">Please wait while we load your data...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header Section */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground mt-2">
						Welcome to Voltig. Monitor your workflow automation platform.
					</p>
				</div>
				<div className="flex items-center gap-4">
					<Button onClick={() => setCreateProjectOpen(true)}>
						<Plus className="h-4 w-4 mr-2" />
						Create Project
					</Button>
				</div>
			</div>

			{/* Stats Overview */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Projects</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalProjects}</div>
						<p className="text-xs text-muted-foreground">
							Across all your workspaces
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Flows</CardTitle>
						<GitBranch className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">
							No flows created yet
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Agents</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.activeAgents}</div>
						<p className="text-xs text-muted-foreground">
							of {stats.totalAgents} total agents
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">This Month</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">
							No executions yet
						</p>
					</CardContent>
				</Card>
			</div>


			{/* Recent Activity */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Recent Agents */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Recent Agents</CardTitle>
								<CardDescription>Your latest AI agents</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{stats.recentAgents.length > 0 ? (
							<div className="space-y-3">
								{stats.recentAgents.map((agent) => (
									<div
										key={agent.id}
										className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
									>
										<div className="flex items-center space-x-3">
											<div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
												<Users className="h-4 w-4 text-primary" />
											</div>
											<div>
												<h4 className="font-medium text-sm">{agent.name}</h4>
												<p className="text-xs text-muted-foreground">
													{agent.description || "No description"}
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<Badge 
												variant={agent.status === 'active' ? 'default' : 'secondary'}
												className="text-xs"
											>
												{agent.status}
											</Badge>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-6">
								<Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
								<h3 className="font-medium mb-2">No agents yet</h3>
								<p className="text-sm text-muted-foreground mb-3">
									Create your first AI agent
								</p>
								<Button size="sm" asChild>
									<Link to="/dashboard">Create Agent</Link>
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* System Health */}
				<Card>
					<CardHeader>
						<CardTitle>System Health</CardTitle>
						<CardDescription>Platform performance metrics</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Flow Execution Rate</span>
								<span>--</span>
							</div>
							<Progress value={0} className="h-2" />
							<p className="text-xs text-muted-foreground">No executions yet</p>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>System Uptime</span>
								<span>99.9%</span>
							</div>
							<Progress value={99.9} className="h-2" />
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Agent Connectivity</span>
								<span>{stats.totalAgents > 0 ? Math.round((stats.activeAgents / stats.totalAgents) * 100) : 0}%</span>
							</div>
							<Progress value={stats.totalAgents > 0 ? (stats.activeAgents / stats.totalAgents) * 100 : 0} className="h-2" />
						</div>
						<Separator />
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center">
								<Clock className="h-4 w-4 mr-2" />
								Last Updated
							</span>
							<span className="text-muted-foreground">Just now</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Project Create Dialog */}
			<ProjectCreateDialog
				open={createProjectOpen}
				onOpenChange={setCreateProjectOpen}
				onSubmit={handleCreateProject}
			/>
		</div>
	);
}
