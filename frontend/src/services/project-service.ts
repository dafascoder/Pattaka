import type { 
	Project, 
	ProjectUsage, 
	CreateProjectRequest, 
	UpdateProjectRequest,
	APIResponse 
} from "@/types/api";
import { fetchWrapper } from "@/utils/fetch-wrapper";

export const projectService = {
	// Get all projects for the current user
	getProjects: async (): Promise<Project[]> => {
		const response = await fetchWrapper("/api/v1/projects", {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch projects");
		}

		return response.data.data as Project[];
	},

	// Get a specific project by ID
	getProject: async (projectId: string): Promise<Project> => {
		const response = await fetchWrapper(`/api/v1/projects/${projectId}`, {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch project");
		}

		return response.data as Project;
	},

	// Create a new project
	createProject: async (projectData: CreateProjectRequest): Promise<Project> => {
		const response = await fetchWrapper("/api/v1/projects", {
			method: "POST",
			body: JSON.stringify(projectData),
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to create project");
		}

		return response.data as Project;
	},

	// Update an existing project
	updateProject: async (
		projectId: string, 
		projectData: UpdateProjectRequest
	): Promise<Project> => {
		const response = await fetchWrapper(`/api/v1/projects/${projectId}`, {
			method: "PUT",
			body: JSON.stringify(projectData),
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to update project");
		}

		return response.data as Project;
	},

	// Delete a project
	deleteProject: async (projectId: string): Promise<void> => {
		const response = await fetchWrapper(`/api/v1/projects/${projectId}`, {
			method: "DELETE",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to delete project");
		}
	},

	// Get project usage statistics
	getProjectUsage: async (projectId: string): Promise<ProjectUsage> => {
		const response = await fetchWrapper(`/api/v1/projects/${projectId}/usage`, {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch project usage");
		}

		return response.data as ProjectUsage;
	},
}; 