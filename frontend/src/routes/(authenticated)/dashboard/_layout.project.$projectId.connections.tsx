import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Settings, Trash2, Zap } from "lucide-react";
import { projectService } from "@/services/project-service";

export const Route = createFileRoute("/(authenticated)/dashboard/_layout/project/$projectId/connections")({
	component: ProjectConnectionsPage,
	loader: async ({ context, params }) => {
		const projectId = params.projectId as string;
		
		try {
			// TODO: Implement actual connections service
			const appConnections: any[] = [];
			const project = await context.queryClient.fetchQuery({
				queryKey: ["project", projectId],
				queryFn: () => projectService.getProject(projectId)
			});
			
			return { 
				project,
				projectId,
				appConnections: appConnections || [],
				loading: false 
			};
		} catch (error) {
			console.error("Project connections loader error:", error);
			return { 
				
				projectId,
				appConnections: [],
				loading: false,
				error: error instanceof Error ? error.message : "Failed to load connections"
			};
		}
	},
});

function ProjectConnectionsPage() {
	const { projectId, appConnections, loading, error, project } = Route.useLoaderData();

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Connections</h2>
					<p className="text-muted-foreground">{error}</p>
				</div>
			</div>
		);
	}

	const getConnectionIcon = (type: string) => {
		switch (type) {
			case 'api':
				return <Zap className="h-4 w-4 text-blue-500" />;
			case 'database':
				return <Settings className="h-4 w-4 text-green-500" />;
			default:
				return <Settings className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const getStatusVariant = (status: string) => {
		switch (status) {
			case 'connected':
				return 'default';
			case 'error':
				return 'destructive';
			case 'connecting':
				return 'secondary';
			default:
				return 'outline';
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Connections</h1>
					<p className="text-muted-foreground">
						Manage app connections for {project.displayName}
					</p>
				</div>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Add Connection
				</Button>
			</div>

			{/* Connections Table */}
			<Card>
				<CardHeader>
					<CardTitle>App Connections</CardTitle>
				</CardHeader>
				<CardContent>
					{appConnections.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Last Used</TableHead>
									<TableHead className="w-[120px]">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{appConnections.map((connection: any) => (
									<TableRow key={connection.id}>
										<TableCell>
											<div className="flex items-center space-x-3">
												<div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
													{getConnectionIcon(connection.type)}
												</div>
												<div>
													<div className="font-medium">
														{connection.name}
													</div>
													<div className="text-sm text-muted-foreground">
														{connection.description}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline">{connection.type}</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={getStatusVariant(connection.status)}>
												{connection.status}
											</Badge>
										</TableCell>
										<TableCell>
											{new Date(connection.created).toLocaleDateString()}
										</TableCell>
										<TableCell>
											{connection.lastUsed ? 
												new Date(connection.lastUsed).toLocaleDateString() : 
												"Never"
											}
										</TableCell>
										<TableCell>
											<div className="flex items-center space-x-2">
												<Button variant="ghost" size="sm">
													<Settings className="h-4 w-4" />
												</Button>
												<Button variant="ghost" size="sm">
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<div className="text-center py-12">
							<Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-medium mb-2">No connections yet</h3>
							<p className="text-muted-foreground mb-4">
								Connect external services to use in your flows
							</p>
							<Button>
								<Plus className="h-4 w-4 mr-2" />
								Add Your First Connection
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Available Integrations */}
			<Card>
				<CardHeader>
					<CardTitle>Available Integrations</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{[
							{ name: "HTTP API", type: "api", description: "Connect to any REST API" },
							{ name: "Email", type: "email", description: "Send and receive emails" },
							{ name: "Webhook", type: "webhook", description: "Receive HTTP webhooks" },
							{ name: "Database", type: "database", description: "Connect to databases" },
							{ name: "Slack", type: "slack", description: "Slack integration" },
							{ name: "Discord", type: "discord", description: "Discord bot integration" },
						].map((integration) => (
							<Card key={integration.name} className="hover:shadow-md transition-shadow cursor-pointer">
								<CardContent className="p-4">
									<div className="flex items-center space-x-3">
										<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
											{getConnectionIcon(integration.type)}
										</div>
										<div className="flex-1">
											<h4 className="font-medium">{integration.name}</h4>
											<p className="text-sm text-muted-foreground">
												{integration.description}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 