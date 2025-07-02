import type { Agent } from "@/types/api";
import { fetchWrapper } from "@/utils/fetch-wrapper";

export const agentService = {
	getAgents: async (): Promise<Agent[]> => {
		const response = await fetchWrapper("/api/agents", {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch agents");
		}

		const data = response.data as Agent[];
		console.log(data);
		return data;
	},

	getAgent: async (id: string): Promise<Agent> => {
		const response = await fetchWrapper(`/api/agents/${id}`, {
			method: "GET",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to fetch agent");
		}

		const data = response.data as Agent;
		return data;
	},

	createAgent: async (agent: Agent): Promise<Agent> => {
		const response = await fetchWrapper("/api/agents", {
			method: "POST",
			body: JSON.stringify(agent),
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to create agent");
		}

		const data = response.data as Agent;
		return data;
	},

	updateAgent: async (id: string, agent: Agent): Promise<Agent> => {
		const response = await fetchWrapper(`/api/agents/${id}`, {
			method: "PUT",
			body: JSON.stringify(agent),
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to update agent");
		}

		const data = response.data as Agent;
		return data;
	},

	deleteAgent: async (id: string) => {
		const response = await fetchWrapper(`/api/agents/${id}`, {
			method: "DELETE",
		});

		if (!response.success) {
			throw new Error(response.error || "Failed to delete agent");
		}

		return response.data;
	},
};
