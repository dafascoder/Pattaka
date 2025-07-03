import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth-middleware";
import { projectService } from "@/services/project-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Activity,
	Building2,
	Database,
	GitBranch,
	Settings,
	Zap,
} from "lucide-react";

export const Route = createFileRoute("/(authenticated)/dashboard/project/$projectId")({
	beforeLoad: requireAuth,
	loader: async ({ context, params }) => {
		const projectId = params.projectId as string;
		
		try {
			const project = await context.queryClient.fetchQuery({
				queryKey: ["project", projectId],
				queryFn: () => projectService.getProject(projectId),
			});
			
			return { project };
		} catch (error) {
			console.error("Project loader error:", error);
			throw new Error("Failed to load project");
		}
	},
	component: ProjectLayoutComponent,
});

function ProjectLayoutComponent() {
	const { project } = Route.useLoaderData();
	
	return (
		<div className="flex flex-col space-y-8">
			{/* Project Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<div className="flex items-center space-x-3">
						<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
							<Building2 className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold">{project.displayName}</h1>
							<p className="text-muted-foreground">
								{project.metadata?.description || "No description"}
							</p>
						</div>
					</div>
					<Badge variant="outline" className="ml-4">
						{project.notifyStatus || "Active"}
					</Badge>
				</div>
				<div className="flex items-center space-x-4">
					<Button variant="outline" asChild>
						<Link to="/dashboard/project/$projectId/settings" params={{ projectId: project.id }}>
							<Settings className="h-4 w-4 mr-2" />
							Settings
						</Link>
					</Button>
				</div>
			</div>

			{/* Project Navigation */}
			<Card>
				<CardHeader>
					<CardTitle>Project Navigation</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<Link 
							to="/dashboard/project/$projectId/flows" 
							params={{ projectId: project.id }}
							className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
						>
							<GitBranch className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-medium">Flows</h3>
								<p className="text-sm text-muted-foreground">Manage workflows</p>
							</div>
						</Link>
						
						<Link 
							to="/dashboard/project/$projectId/executions" 
							params={{ projectId: project.id }}
							className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
						>
							<Activity className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-medium">Executions</h3>
								<p className="text-sm text-muted-foreground">Flow runs</p>
							</div>
						</Link>
						
						<Link 
							to="/dashboard/project/$projectId/connections" 
							params={{ projectId: project.id }}
							className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
						>
							<Zap className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-medium">Connections</h3>
								<p className="text-sm text-muted-foreground">App connections</p>
							</div>
						</Link>
						
						<Link 
							to="/dashboard/project/$projectId" 
							params={{ projectId: project.id }}
							className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
						>
							<Database className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-medium">Data</h3>
								<p className="text-sm text-muted-foreground">API tables</p>
							</div>
						</Link>
					</div>
				</CardContent>
			</Card>

			<Separator />

			{/* Project Content */}
			<div className="flex-1">
				<Outlet />
			</div>
		</div>
	);
} 