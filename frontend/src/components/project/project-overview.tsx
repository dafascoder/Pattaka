import {
	Activity,
	AlertCircle,
	BarChart3,
	CheckCircle,
	Clock,
	GitBranch,
	Loader2,
	Play,
	Plus,
	Settings,
	TrendingUp,
	Users,
	XCircle,
	Zap,
} from "lucide-react";
import React from "react";
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
import type { Project, Flow, FlowRun } from "@/types/api";

interface ProjectOverviewProps {
	project: Project | undefined;
	flows?: Flow[];
	flowRuns?: FlowRun[];
	loading?: boolean;
}

export function ProjectOverview({
	project,
	flows = [],
	flowRuns = [],
	loading = false,
}: ProjectOverviewProps) {
	// Calculate project statistics
	const stats = {
		totalFlows: flows.length,
		activeFlows: flows.filter(flow => flow.status === 'active').length,
		totalRuns: flowRuns.length,
		successfulRuns: flowRuns.filter(run => run.status === 'completed').length,
		failedRuns: flowRuns.filter(run => run.status === 'failed').length,
		runningRuns: flowRuns.filter(run => run.status === 'running').length,
		successRate: flowRuns.length > 0 ? Math.round((flowRuns.filter(run => run.status === 'completed').length / flowRuns.length) * 100) : 0,
		recentFlows: flows.slice(0, 5),
		recentRuns: flowRuns.slice(0, 5),
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<h2 className="text-xl font-semibold mb-2">Loading Project</h2>
					<p className="text-muted-foreground">Please wait while we load your project data...</p>
				</div>
			</div>
		);
	}

	if (!project) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-destructive mb-2">Project not found</h2>
					<p className="text-muted-foreground">The project you are looking for does not exist.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Project Stats */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Flows</CardTitle>
						<GitBranch className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalFlows}</div>
						<p className="text-xs text-muted-foreground">
							{stats.activeFlows} active
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Runs</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalRuns}</div>
						<p className="text-xs text-muted-foreground">
							{stats.runningRuns} running
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Success Rate</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.successRate}%</div>
						<p className="text-xs text-muted-foreground">
							{stats.successfulRuns} successful
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Failed Runs</CardTitle>
						<XCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.failedRuns}</div>
						<p className="text-xs text-muted-foreground">
							Requires attention
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content Grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Recent Flows */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Recent Flows</CardTitle>
								<CardDescription>
									Latest workflows in this project
								</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link to="/dashboard/project/$projectId/flows" params={{ projectId: project.id }}>
									View All
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{stats.recentFlows.length > 0 ? (
							<div className="space-y-4">
								{stats.recentFlows.map((flow) => (
									<div
										key={flow.id}
										className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
									>
										<div className="flex items-center space-x-4">
											<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
												<GitBranch className="h-5 w-5 text-primary" />
											</div>
											<div>
												<h4 className="font-medium">Flow {flow.id}</h4>
												<p className="text-sm text-muted-foreground">
													{flow.schedule ? `Scheduled: ${flow.schedule}` : 'Manual trigger'}
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<Badge variant={flow.status === 'active' ? 'default' : 'secondary'}>
												{flow.status}
											</Badge>
											<Button variant="ghost" size="sm" asChild>
												<Link to="/dashboard/project/$projectId/flows" params={{ projectId: project.id }}>
													<Play className="h-4 w-4" />
												</Link>
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8">
								<GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="font-medium mb-2">No flows yet</h3>
								<p className="text-sm text-muted-foreground mb-4">
									Create your first workflow to get started
								</p>
								<Button asChild>
									<Link to="/builder">
										<Plus className="h-4 w-4 mr-2" />
										Create Flow
									</Link>
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Quick Actions */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
						<CardDescription>Project management tools</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button className="w-full justify-start" asChild>
							<Link to="/builder">
								<Plus className="h-4 w-4 mr-2" />
								Create Flow
							</Link>
						</Button>
						<Button variant="outline" className="w-full justify-start" asChild>
							<Link to="/dashboard/project/$projectId/connections" params={{ projectId: project.id }}>
								<Zap className="h-4 w-4 mr-2" />
								Manage Connections
							</Link>
						</Button>
						<Button variant="outline" className="w-full justify-start" asChild>
							<Link to="/dashboard/project/$projectId/executions" params={{ projectId: project.id }}>
								<Activity className="h-4 w-4 mr-2" />
								View Executions
							</Link>
						</Button>
						<Button variant="outline" className="w-full justify-start" asChild>
							<Link to="/dashboard/project/$projectId/settings" params={{ projectId: project.id }}>
								<Settings className="h-4 w-4 mr-2" />
								Project Settings
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Recent Runs */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Recent Runs</CardTitle>
								<CardDescription>Latest flow executions</CardDescription>
							</div>
							<Button variant="ghost" size="sm" asChild>
								<Link to="/dashboard/project/$projectId/executions" params={{ projectId: project.id }}>
									View All
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{stats.recentRuns.length > 0 ? (
							<div className="space-y-3">
								{stats.recentRuns.map((run) => (
									<div
										key={run.id}
										className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
									>
										<div className="flex items-center space-x-3">
											<div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
												{run.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
												{run.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
												{run.status === 'running' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
												{run.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
											</div>
											<div>
												<h4 className="font-medium text-sm">
													{run.flowDisplayName || `Flow ${run.flowVersionId}`}
												</h4>
												<p className="text-xs text-muted-foreground">
													{new Date(run.startTime).toLocaleString()}
												</p>
											</div>
										</div>
										<div className="flex items-center space-x-2">
											<Badge 
												variant={
													run.status === 'completed' ? 'default' : 
													run.status === 'failed' ? 'destructive' : 
													run.status === 'running' ? 'secondary' : 'outline'
												}
												className="text-xs"
											>
												{run.status}
											</Badge>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-6">
								<Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
								<h3 className="font-medium mb-2">No runs yet</h3>
								<p className="text-sm text-muted-foreground mb-3">
									Execute a flow to see runs here
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Project Health */}
				<Card>
					<CardHeader>
						<CardTitle>Project Health</CardTitle>
						<CardDescription>Performance metrics</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Success Rate</span>
								<span>{stats.successRate}%</span>
							</div>
							<Progress value={stats.successRate} className="h-2" />
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Active Flows</span>
								<span>{stats.activeFlows} of {stats.totalFlows}</span>
							</div>
							<Progress value={stats.totalFlows > 0 ? (stats.activeFlows / stats.totalFlows) * 100 : 0} className="h-2" />
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between text-sm">
								<span>Running Executions</span>
								<span>{stats.runningRuns}</span>
							</div>
							<Progress value={stats.runningRuns > 0 ? 100 : 0} className="h-2" />
						</div>
						<Separator />
						<div className="flex items-center justify-between text-sm">
							<span className="flex items-center">
								<Clock className="h-4 w-4 mr-2" />
								Project Created
							</span>
							<span className="text-muted-foreground">
								{new Date(project.created).toLocaleDateString()}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
} 