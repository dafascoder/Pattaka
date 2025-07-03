import { createFileRoute, useParams } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import { projectService } from "@/services/project-service";

export const Route = createFileRoute("/(authenticated)/dashboard/_layout/project/$projectId/settings")({
	component: ProjectSettingsPage,
	loader: async ({ context, params }) => {
		const projectId = params.projectId as string;
		
		try {
			const project = await context.queryClient.fetchQuery({
				queryKey: ["project", projectId],
				queryFn: () => projectService.getProject(projectId),
			});
			
			return { 
				projectId,
				project,
				loading: false 
			};
		} catch (error) {
			console.error("Project settings loader error:", error);
			return { 
				projectId,
				project: null,
				loading: false,
				error: error instanceof Error ? error.message : "Failed to load project settings"
			};
		}
	},
});

function ProjectSettingsPage() {
	const { projectId, project, loading, error } = Route.useLoaderData();

	if (error || !project) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Settings</h2>
					<p className="text-muted-foreground">{error || "Project not found"}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Project Settings</h1>
					<p className="text-muted-foreground">
						Manage settings for {project?.displayName}
					</p>
				</div>
			</div>

			{/* General Settings */}
			<Card>
				<CardHeader>
					<CardTitle>General</CardTitle>
					<CardDescription>
						Basic project information and configuration
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="project-name">Project Name</Label>
							<Input
								id="project-name"
								type="text"
								defaultValue={project?.displayName}
								placeholder="Enter project name"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="project-id">Project ID</Label>
							<Input
								id="project-id"
								type="text"
								value={project?.id}
								readOnly
								className="bg-muted"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="project-description">Description</Label>
						<Textarea
							id="project-description"
							placeholder="Enter project description"
							defaultValue={project.metadata?.description || ""}
							rows={3}
						/>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="notifications"
							defaultChecked={project.notifyStatus === "enabled"}
						/>
						<Label htmlFor="notifications">Enable notifications</Label>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="releases"
							defaultChecked={project.releasesEnabled}
						/>
						<Label htmlFor="releases">Enable releases</Label>
					</div>
				</CardContent>
			</Card>

			{/* Status & Metadata */}
			<Card>
				<CardHeader>
					<CardTitle>Project Status</CardTitle>
					<CardDescription>
						Current project status and metadata
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Status</Label>
							<Badge variant="outline" className="w-fit">
								Active
							</Badge>
						</div>
						<div className="space-y-2">
							<Label>External ID</Label>
							<Input
								type="text"
								defaultValue={project.externalId || ""}
								placeholder="External system ID"
							/>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Created</Label>
							<Input
								type="text"
								value={new Date(project.created).toLocaleString()}
								readOnly
								className="bg-muted"
							/>
						</div>
						<div className="space-y-2">
							<Label>Last Updated</Label>
							<Input
								type="text"
								value={new Date(project.updated).toLocaleString()}
								readOnly
								className="bg-muted"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Environment Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Environment</CardTitle>
					<CardDescription>
						Environment-specific configuration
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="environment">Default Environment</Label>
						<Input
							id="environment"
							type="text"
							defaultValue="production"
							placeholder="production, staging, development"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="variables">Environment Variables</Label>
						<Textarea
							id="variables"
							placeholder="KEY1=value1&#10;KEY2=value2"
							rows={4}
						/>
						<p className="text-sm text-muted-foreground">
							One variable per line in KEY=value format
						</p>
					</div>
				</CardContent>
			</Card>

			{/* API Settings */}
			<Card>
				<CardHeader>
					<CardTitle>API Configuration</CardTitle>
					<CardDescription>
						API keys and webhook configuration
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="api-key">API Key</Label>
						<div className="flex space-x-2">
							<Input
								id="api-key"
								type="password"
								placeholder="••••••••••••••••"
								readOnly
								className="bg-muted"
							/>
							<Button variant="outline">Regenerate</Button>
							<Button variant="outline">Copy</Button>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="webhook-url">Webhook URL</Label>
						<Input
							id="webhook-url"
							type="url"
							placeholder="https://your-domain.com/webhook"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex items-center justify-between pt-4">
				<div className="flex space-x-2">
					<Button>
						<Save className="h-4 w-4 mr-2" />
						Save Changes
					</Button>
					<Button variant="outline">
						Reset
					</Button>
				</div>
			</div>

			<Separator />

			{/* Danger Zone */}
			<Card className="border-destructive/50">
				<CardHeader>
					<CardTitle className="text-destructive flex items-center">
						<AlertTriangle className="h-5 w-5 mr-2" />
						Danger Zone
					</CardTitle>
					<CardDescription>
						Irreversible and destructive actions
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-4 border rounded-lg">
						<div>
							<h4 className="font-medium">Delete Project</h4>
							<p className="text-sm text-muted-foreground">
								Permanently delete this project and all its data
							</p>
						</div>
						<Button variant="destructive">
							<Trash2 className="h-4 w-4 mr-2" />
							Delete Project
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 