import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateProjectRequest, Project } from "@/types/api";

interface ProjectCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (project: CreateProjectRequest) => Promise<Project>;
	isCreating?: boolean;
}

const initialProject: CreateProjectRequest = {
	displayName: "",
	notifyStatus: "active",
	releasesEnabled: true,
	metadata: {},
};

export function ProjectCreateDialog({
	open,
	onOpenChange,
	onSubmit,
	isCreating = false,
}: ProjectCreateDialogProps) {
	const navigate = useNavigate();
	const [project, setProject] = useState<CreateProjectRequest>(initialProject);
	const [description, setDescription] = useState("");
	const [errors, setErrors] = useState<Partial<CreateProjectRequest>>({});

	const validateForm = (): boolean => {
		const newErrors: Partial<CreateProjectRequest> = {};

		if (!project.displayName.trim()) {
			newErrors.displayName = "Project name is required";
		} else if (project.displayName.length < 3) {
			newErrors.displayName = "Project name must be at least 3 characters";
		}

		if (description && description.length > 500) {
			// We'll store description in metadata
			newErrors.metadata = { description: "Description must be less than 500 characters" };
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			toast.error("Please fix the form errors");
			return;
		}

		try {
			const projectData = {
				...project,
				metadata: {
					...project.metadata,
					description: description.trim() || undefined,
				},
			};

			const newProject = await onSubmit(projectData);
			setProject(initialProject);
			setDescription("");
			setErrors({});
			onOpenChange(false);
			toast.success("Project created successfully!");

			// Navigate to the new project
			navigate({
				to: "/dashboard/project/$projectId",
				params: { projectId: newProject.id },
			});
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to create project"
			);
		}
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setProject(initialProject);
			setDescription("");
			setErrors({});
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Create New Project</DialogTitle>
					<DialogDescription>
						Create a new project to organize your flows and workflows.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="space-y-2">
						<Label htmlFor="displayName">
							Project Name <span className="text-red-500">*</span>
						</Label>
						<Input
							className={
								errors.displayName ? "border-red-500 focus-visible:ring-red-500" : ""
							}
							id="displayName"
							onChange={(e) => {
								setProject({ ...project, displayName: e.target.value });
								if (errors.displayName) setErrors({ ...errors, displayName: undefined });
							}}
							placeholder="Enter project name"
							value={project.displayName}
						/>
						{errors.displayName && (
							<p className="text-red-500 text-sm">{errors.displayName}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							className={
								errors.metadata?.description
									? "border-red-500 focus-visible:ring-red-500"
									: ""
							}
							id="description"
							onChange={(e) => {
								setDescription(e.target.value);
								if (errors.metadata?.description)
									setErrors({ ...errors, metadata: undefined });
							}}
							placeholder="Describe what this project is for"
							rows={3}
							value={description}
						/>
						{errors.metadata?.description && (
							<p className="text-red-500 text-sm">{errors.metadata.description}</p>
						)}
						<p className="text-muted-foreground text-xs">
							{description.length}/500 characters
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notifyStatus">Notification Status</Label>
						<Select
							value={project.notifyStatus}
							onValueChange={(value) => setProject({ ...project, notifyStatus: value })}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select notification status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="paused">Paused</SelectItem>
								<SelectItem value="disabled">Disabled</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex items-center space-x-2">
						<Switch
							checked={project.releasesEnabled}
							id="releasesEnabled"
							onCheckedChange={(checked) =>
								setProject({ ...project, releasesEnabled: checked })
							}
						/>
						<Label className="font-normal text-sm" htmlFor="releasesEnabled">
							Enable releases and versioning
						</Label>
					</div>

					<div className="flex justify-end space-x-2 pt-4">
						<Button
							disabled={isCreating}
							onClick={() => handleOpenChange(false)}
							variant="outline"
						>
							Cancel
						</Button>
						<Button
							disabled={isCreating || !project.displayName.trim()}
							onClick={handleSubmit}
						>
							{isCreating ? "Creating..." : "Create Project"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
} 