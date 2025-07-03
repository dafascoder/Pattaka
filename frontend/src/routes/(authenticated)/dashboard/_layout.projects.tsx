import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth-middleware";
import { projectService } from "@/services/project-service";
import { useState } from "react";
import { Building2, Plus, Settings, GitBranch, Activity, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCreateDialog } from "@/components/project";
import { toast } from "sonner";

export const Route = createFileRoute("/(authenticated)/dashboard/_layout/projects")({
	beforeLoad: requireAuth,
	loader: async ({ context }) => {
		try {
			const projects = await context.queryClient.fetchQuery({
				queryKey: ["projects"],
				queryFn: () => projectService.getProjects(),
			});
			
			return { projects };
		} catch (error) {
			console.error("Projects loader error:", error);
			return { projects: [] };
		}
	},
	component: ProjectsListComponent,
});

function ProjectsListComponent() {
	const { projects } = Route.useLoaderData();
	const [createProjectOpen, setCreateProjectOpen] = useState(false);

	const handleCreateProject = async (projectData: any) => {
		try {
			const newProject = await projectService.createProject(projectData);
			toast.success("Project created successfully!");
			return newProject;
		} catch (error) {
			toast.error("Failed to create project");
			throw error;
		}
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Projects</h1>
					<p className="text-muted-foreground">
						Manage your workflow automation projects
					</p>
				</div>
				<Button onClick={() => setCreateProjectOpen(true)}>
					<Plus className="h-4 w-4 mr-2" />
					Create Project
				</Button>
			</div>

			{/* Projects Grid */}
			{projects.length > 0 ? (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{projects.map((project) => (
						<Card key={project.id} className="hover:shadow-lg transition-shadow">
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-center space-x-3">
										<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
											<Building2 className="h-6 w-6 text-primary" />
										</div>
										<div className="flex-1">
											<CardTitle className="text-lg">{project.displayName}</CardTitle>
											<CardDescription className="mt-1">
												{project.metadata?.description || "No description"}
											</CardDescription>
										</div>
									</div>
									<Badge variant="outline">
										{project.notifyStatus || "Active"}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Project Stats */}
								<div className="grid grid-cols-3 gap-4 text-center">
									<div>
										<div className="text-2xl font-bold">0</div>
										<div className="text-xs text-muted-foreground">Flows</div>
									</div>
									<div>
										<div className="text-2xl font-bold">0</div>
										<div className="text-xs text-muted-foreground">Runs</div>
									</div>
									<div>
										<div className="text-2xl font-bold">0</div>
										<div className="text-xs text-muted-foreground">Connections</div>
									</div>
								</div>

								{/* Quick Actions */}
								<div className="space-y-2">
									<Button asChild className="w-full justify-start" size="sm">
										<Link to="/dashboard/project/$projectId" params={{ projectId: project.id }}>
											<Building2 className="h-4 w-4 mr-2" />
											Open Project
										</Link>
									</Button>
									<div className="grid grid-cols-3 gap-2">
										<Button variant="outline" size="sm" asChild>
											<Link to="/dashboard/project/$projectId/flows" params={{ projectId: project.id }}>
												<GitBranch className="h-4 w-4" />
											</Link>
										</Button>
										<Button variant="outline" size="sm" asChild>
											<Link to="/dashboard/project/$projectId/executions" params={{ projectId: project.id }}>
												<Activity className="h-4 w-4" />
											</Link>
										</Button>
										<Button variant="outline" size="sm" asChild>
											<Link to="/dashboard/project/$projectId/settings" params={{ projectId: project.id }}>
												<Settings className="h-4 w-4" />
											</Link>
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<Building2 className="h-16 w-16 text-muted-foreground mb-4" />
						<h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
						<p className="text-muted-foreground text-center mb-6 max-w-md">
							Create your first project to start building and managing workflows.
							Projects help you organize your automation flows and team collaboration.
						</p>
						<Button onClick={() => setCreateProjectOpen(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Create Your First Project
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Project Create Dialog */}
			<ProjectCreateDialog
				open={createProjectOpen}
				onOpenChange={setCreateProjectOpen}
				onSubmit={handleCreateProject}
			/>
		</div>
	);
} 