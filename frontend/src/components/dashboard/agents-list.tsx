import { Edit, Loader2, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	useAgents,
	useCreateAgent,
	useDeleteAgent,
	useUpdateAgent,
} from "@/lib/react-query";
import type {
	Agent,
	CreateAgentRequest,
	UpdateAgentRequest,
} from "@/types/api";

interface CreateAgentFormData {
	name: string;
	description: string;
	status: string;
}

interface EditAgentFormData {
	name: string;
	description: string;
	status: string;
}

export function AgentsList() {
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

	const [createForm, setCreateForm] = useState<CreateAgentFormData>({
		name: "",
		description: "",
		status: "draft",
	});

	const [editForm, setEditForm] = useState<EditAgentFormData>({
		name: "",
		description: "",
		status: "draft",
	});

	// React Query hooks
	const { data: agents, isLoading, error, refetch } = useAgents();
	const createAgentMutation = useCreateAgent();
	const updateAgentMutation = useUpdateAgent();
	const deleteAgentMutation = useDeleteAgent();

	const handleCreateAgent = async (e: React.FormEvent) => {
		e.preventDefault();

		const agentData: CreateAgentRequest = {
			name: createForm.name,
			description: createForm.description,
			status: createForm.status,
			config: {},
		};

		try {
			await createAgentMutation.mutateAsync(agentData);
			setCreateDialogOpen(false);
			setCreateForm({ name: "", description: "", status: "draft" });
		} catch (error) {
			// Error is handled by the mutation's onError callback
			console.error("Failed to create agent:", error);
		}
	};

	const handleEditAgent = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!editingAgent) return;

		const agentData: UpdateAgentRequest = {
			name: editForm.name,
			description: editForm.description,
			status: editForm.status,
		};

		try {
			await updateAgentMutation.mutateAsync({
				id: editingAgent.id,
				agent: agentData,
			});
			setEditDialogOpen(false);
			setEditingAgent(null);
		} catch (error) {
			console.error("Failed to update agent:", error);
		}
	};

	const handleDeleteAgent = async (agentId: string) => {
		try {
			await deleteAgentMutation.mutateAsync(agentId);
		} catch (error) {
			console.error("Failed to delete agent:", error);
		}
	};

	const openEditDialog = (agent: Agent) => {
		setEditingAgent(agent);
		setEditForm({
			name: agent.name,
			description: agent.description,
			status: agent.status,
		});
		setEditDialogOpen(true);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-500";
			case "draft":
				return "bg-yellow-500";
			case "inactive":
				return "bg-gray-500";
			default:
				return "bg-gray-500";
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin" />
				<span className="ml-2">Loading agents...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-8 text-center">
				<p className="mb-4 text-red-500">
					Failed to load agents: {error.message}
				</p>
				<Button onClick={() => refetch()}>Retry</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl">Agents</h2>
					<p className="text-muted-foreground">Manage your AI agents</p>
				</div>

				<Dialog onOpenChange={setCreateDialogOpen} open={createDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Create Agent
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create New Agent</DialogTitle>
							<DialogDescription>
								Create a new AI agent to automate your workflows.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleCreateAgent}>
							<div className="space-y-4">
								<div>
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										onChange={(e) =>
											setCreateForm({ ...createForm, name: e.target.value })
										}
										placeholder="Enter agent name"
										required
										value={createForm.name}
									/>
								</div>
								<div>
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										onChange={(e) =>
											setCreateForm({
												...createForm,
												description: e.target.value,
											})
										}
										placeholder="Enter agent description"
										value={createForm.description}
									/>
								</div>
								<div>
									<Label htmlFor="status">Status</Label>
									<select
										className="w-full rounded-md border p-2"
										id="status"
										onChange={(e) =>
											setCreateForm({ ...createForm, status: e.target.value })
										}
										value={createForm.status}
									>
										<option value="draft">Draft</option>
										<option value="active">Active</option>
										<option value="inactive">Inactive</option>
									</select>
								</div>
							</div>
							<DialogFooter className="mt-6">
								<Button
									onClick={() => setCreateDialogOpen(false)}
									type="button"
									variant="outline"
								>
									Cancel
								</Button>
								<Button disabled={createAgentMutation.isPending} type="submit">
									{createAgentMutation.isPending && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Create Agent
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{agents?.map((agent) => (
					<Card key={agent.id}>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div>
									<CardTitle className="text-lg">{agent.name}</CardTitle>
									<CardDescription className="mt-1">
										{agent.description || "No description provided"}
									</CardDescription>
								</div>
								<Badge className={getStatusColor(agent.status)}>
									{agent.status}
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<div className="text-muted-foreground text-sm">
									Created: {new Date(agent.created_at).toLocaleDateString()}
								</div>
								<div className="flex space-x-2">
									<Button
										onClick={() => openEditDialog(agent)}
										size="sm"
										variant="outline"
									>
										<Edit className="h-4 w-4" />
									</Button>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button size="sm" variant="outline">
												<Trash2 className="h-4 w-4" />
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Delete Agent</AlertDialogTitle>
												<AlertDialogDescription>
													Are you sure you want to delete "{agent.name}"? This
													action cannot be undone.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													disabled={deleteAgentMutation.isPending}
													onClick={() => handleDeleteAgent(agent.id)}
												>
													{deleteAgentMutation.isPending && (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													)}
													Delete
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Edit Agent Dialog */}
			<Dialog onOpenChange={setEditDialogOpen} open={editDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Agent</DialogTitle>
						<DialogDescription>
							Update your agent configuration.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleEditAgent}>
						<div className="space-y-4">
							<div>
								<Label htmlFor="edit-name">Name</Label>
								<Input
									id="edit-name"
									onChange={(e) =>
										setEditForm({ ...editForm, name: e.target.value })
									}
									placeholder="Enter agent name"
									required
									value={editForm.name}
								/>
							</div>
							<div>
								<Label htmlFor="edit-description">Description</Label>
								<Textarea
									id="edit-description"
									onChange={(e) =>
										setEditForm({ ...editForm, description: e.target.value })
									}
									placeholder="Enter agent description"
									value={editForm.description}
								/>
							</div>
							<div>
								<Label htmlFor="edit-status">Status</Label>
								<select
									className="w-full rounded-md border p-2"
									id="edit-status"
									onChange={(e) =>
										setEditForm({ ...editForm, status: e.target.value })
									}
									value={editForm.status}
								>
									<option value="draft">Draft</option>
									<option value="active">Active</option>
									<option value="inactive">Inactive</option>
								</select>
							</div>
						</div>
						<DialogFooter className="mt-6">
							<Button
								onClick={() => setEditDialogOpen(false)}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
							<Button disabled={updateAgentMutation.isPending} type="submit">
								{updateAgentMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Update Agent
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{agents?.length === 0 && (
				<div className="py-12 text-center">
					<p className="mb-4 text-muted-foreground">No agents found</p>
					<Button onClick={() => setCreateDialogOpen(true)}>
						<Plus className="mr-2 h-4 w-4" />
						Create your first agent
					</Button>
				</div>
			)}
		</div>
	);
}
