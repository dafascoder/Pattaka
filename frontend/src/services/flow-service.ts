import type { 
	Flow, 
	FlowVersion, 
	FlowRun,
	CreateFlowRequest, 
	UpdateFlowRequest,
	CreateFlowVersionRequest,
	UpdateFlowVersionRequest,
	ExecuteFlowRequest,
	APIResponse 
} from "@/types/api";
import { fetchWrapper } from "@/utils/fetch-wrapper";

export const flowService = {
	// ===== FLOW MANAGEMENT =====
	
	// Get all flows for a project
	getFlows: async (projectId: string): Promise<Flow[]> => {
		const response = await fetchWrapper(`/api/v1/projects/${projectId}/flows`, {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch flows");
		}

		return response.data.data as Flow[];
	},

	// Get a specific flow
	getFlow: async (projectId: string, flowId: string): Promise<Flow> => {
		const response = await fetchWrapper(`/api/v1/projects/${projectId}/flows/${flowId}`, {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch flow");
		}

		return response.data as Flow;
	},

	// Create a new flow
	createFlow: async (projectId: string, flowData: CreateFlowRequest): Promise<Flow> => {
		const response = await fetchWrapper(`/api/v1/projects/${projectId}/flows`, {
			method: "POST",
			body: JSON.stringify(flowData),
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to create flow");
		}

		return response.data as Flow;
	},

	// Update a flow
	updateFlow: async (
		projectId: string, 
		flowId: string, 
		flowData: UpdateFlowRequest
	): Promise<Flow> => {
		const response = await fetchWrapper(`/api/v1/projects/${projectId}/flows/${flowId}`, {
			method: "PUT",
			body: JSON.stringify(flowData),
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to update flow");
		}

		return response.data as Flow;
	},

	// Delete a flow
	deleteFlow: async (projectId: string, flowId: string): Promise<void> => {
		const response = await fetchWrapper(`/api/v1/projects/${projectId}/flows/${flowId}`, {
			method: "DELETE",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to delete flow");
		}
	},

	// ===== FLOW VERSION MANAGEMENT =====

	// Get all versions for a flow
	getFlowVersions: async (flowId: string): Promise<FlowVersion[]> => {
		const response = await fetchWrapper(`/api/v1/flows/${flowId}/versions`, {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch flow versions");
		}

		return response.data.data as FlowVersion[];
	},

	// Get a specific flow version
	getFlowVersion: async (flowId: string, versionId: string): Promise<FlowVersion> => {
		const response = await fetchWrapper(`/api/v1/flows/${flowId}/versions/${versionId}`, {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch flow version");
		}

		return response.data as FlowVersion;
	},

	// Create a new flow version
	createFlowVersion: async (
		flowId: string, 
		versionData: CreateFlowVersionRequest
	): Promise<FlowVersion> => {
		const response = await fetchWrapper(`/api/v1/flows/${flowId}/versions`, {
			method: "POST",
			body: JSON.stringify(versionData),
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to create flow version");
		}

		return response.data as FlowVersion;
	},

	// Update a flow version
	updateFlowVersion: async (
		flowId: string, 
		versionId: string, 
		versionData: UpdateFlowVersionRequest
	): Promise<FlowVersion> => {
		const response = await fetchWrapper(`/api/v1/flows/${flowId}/versions/${versionId}`, {
			method: "PUT",
			body: JSON.stringify(versionData),
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to update flow version");
		}

		return response.data as FlowVersion;
	},

	// Delete a flow version
	deleteFlowVersion: async (flowId: string, versionId: string): Promise<void> => {
		const response = await fetchWrapper(`/api/v1/flows/${flowId}/versions/${versionId}`, {
			method: "DELETE",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to delete flow version");
		}
	},

	// ===== FLOW EXECUTION =====

	// Execute a flow
	executeFlow: async (flowId: string, executionData: ExecuteFlowRequest): Promise<FlowRun> => {
		const response = await fetchWrapper(`/api/v1/flows/${flowId}/execute`, {
			method: "POST",
			body: JSON.stringify(executionData),
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to execute flow");
		}

		return response.data as FlowRun;
	},

	// Get flow runs for a project
	getFlowRuns: async (projectId: string): Promise<FlowRun[]> => {
		const response = await fetchWrapper(`/api/v1/projects/${projectId}/flow-runs`, {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch flow runs");
		}

		return response.data.data as FlowRun[];
	},

	// Get a specific flow run
	getFlowRun: async (runId: string): Promise<FlowRun> => {
		const response = await fetchWrapper(`/api/v1/flow-runs/${runId}`, {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch flow run");
		}

		return response.data as FlowRun;
	},

	// ===== FLOW RUN CONTROL =====

	// Pause a flow run
	pauseFlowRun: async (runId: string): Promise<void> => {
		const response = await fetchWrapper(`/api/v1/flow-runs/${runId}/pause`, {
			method: "POST",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to pause flow run");
		}
	},

	// Resume a flow run
	resumeFlowRun: async (runId: string): Promise<void> => {
		const response = await fetchWrapper(`/api/v1/flow-runs/${runId}/resume`, {
			method: "POST",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to resume flow run");
		}
	},

	// Cancel a flow run
	cancelFlowRun: async (runId: string): Promise<void> => {
		const response = await fetchWrapper(`/api/v1/flow-runs/${runId}/cancel`, {
			method: "POST",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to cancel flow run");
		}
	},
}; 