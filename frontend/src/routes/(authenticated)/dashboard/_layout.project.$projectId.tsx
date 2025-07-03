import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth-middleware";
import { projectService } from "@/services/project-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import {
	Activity,
	Building2,
	GitBranch,
	Settings,
	Zap,
	ChevronLeft,
} from "lucide-react";

export const Route = createFileRoute("/(authenticated)/dashboard/_layout/project/$projectId")({
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
		<div className="space-y-6">
			{/* Breadcrumb Navigation */}
			<div className="flex items-center justify-between">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/dashboard">Dashboard</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/dashboard/projects">Projects</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{project.displayName}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<Button variant="outline" size="sm" asChild>
					<Link to="/dashboard/projects">
						<ChevronLeft className="h-4 w-4 mr-2" />
						Back to Projects
					</Link>
				</Button>
			</div>

			{/* Project Header */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
								<Building2 className="h-6 w-6 text-primary" />
							</div>
							<div>
								<CardTitle className="text-2xl">{project.displayName}</CardTitle>
								<p className="text-muted-foreground mt-1">
									{project.metadata?.description || "No description"}
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<Badge variant="outline">
								{project.notifyStatus || "Active"}
							</Badge>
							<Button variant="outline" asChild>
								<Link to="/dashboard/project/$projectId/settings" params={{ projectId: project.id }}>
									<Settings className="h-4 w-4 mr-2" />
									Settings
								</Link>
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<Link 
							to="/dashboard/project/$projectId" 
							params={{ projectId: project.id }}
							className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
						>
							<Building2 className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-medium text-sm">Overview</h3>
								<p className="text-xs text-muted-foreground">Project dashboard</p>
							</div>
						</Link>
						
						<Link 
							to="/dashboard/project/$projectId/flows" 
							params={{ projectId: project.id }}
							className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
						>
							<GitBranch className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-medium text-sm">Flows</h3>
								<p className="text-xs text-muted-foreground">Manage workflows</p>
							</div>
						</Link>
						
						<Link 
							to="/dashboard/project/$projectId/executions" 
							params={{ projectId: project.id }}
							className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
						>
							<Activity className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-medium text-sm">Executions</h3>
								<p className="text-xs text-muted-foreground">Flow runs</p>
							</div>
						</Link>
						
						<Link 
							to="/dashboard/project/$projectId/connections" 
							params={{ projectId: project.id }}
							className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
						>
							<Zap className="h-5 w-5 text-primary" />
							<div>
								<h3 className="font-medium text-sm">Connections</h3>
								<p className="text-xs text-muted-foreground">App connections</p>
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