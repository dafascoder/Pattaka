import type { Execution } from "@/types/api";
import { fetchWrapper } from "@/utils/fetch-wrapper";

interface ExecutionStep {
	id: string;
	execution_id: string;
	step_name: string;
	step_type: string;
	status: "pending" | "running" | "completed" | "failed" | "skipped";
	input_data: Record<string, any>;
	output_data: Record<string, any>;
	error_message?: string;
	execution_time_ms: number;
	started_at: string;
	completed_at?: string;
	created_at: string;
}

interface ExecutionWithSteps extends Execution {
	steps?: ExecutionStep[];
}

class ExecutionService {
	private baseUrl: string;

	constructor() {
		this.baseUrl = "/api/executions";
	}

	async getExecutions(limit = 50): Promise<Execution[]> {
		return fetchWrapper.get(`${this.baseUrl}?limit=${limit}`);
	}

	async getExecution(executionId: string): Promise<Execution> {
		return fetchWrapper.get(`${this.baseUrl}/${executionId}`);
	}

	async getExecutionsByWorkflow(
		workflowId: string,
		limit = 50
	): Promise<Execution[]> {
		return fetchWrapper.get(
			`/api/workflows/${workflowId}/executions?limit=${limit}`
		);
	}

	async getExecutionsByAgent(
		agentId: string,
		limit = 50
	): Promise<Execution[]> {
		return fetchWrapper.get(`/api/agents/${agentId}/executions?limit=${limit}`);
	}

	async createExecution(execution: Partial<Execution>): Promise<Execution> {
		return fetchWrapper.post(this.baseUrl, execution);
	}

	async updateExecutionStatus(
		executionId: string,
		status: string,
		outputData?: Record<string, any>,
		completedAt?: string,
		executionTimeMs?: number,
		errorMessage?: string
	): Promise<Execution> {
		return fetchWrapper.put(`${this.baseUrl}/${executionId}/status`, {
			status,
			output_data: outputData,
			completed_at: completedAt,
			execution_time_ms: executionTimeMs,
			error_message: errorMessage,
		});
	}

	async getExecutionDetails(executionId: string): Promise<ExecutionWithSteps> {
		// Get basic execution info
		const execution = await this.getExecution(executionId);

		// Get execution steps from API
		try {
			const steps = await this.getExecutionSteps(executionId);
			return {
				...execution,
				steps,
			};
		} catch (error) {
			// Fallback to mock data if API not available
			const steps = this.generateMockSteps(execution);
			return {
				...execution,
				steps,
			};
		}
	}

	async getExecutionSteps(executionId: string): Promise<ExecutionStep[]> {
		return fetchWrapper.get(`${this.baseUrl}/${executionId}/steps`);
	}

	async cancelExecution(executionId: string): Promise<Execution> {
		return fetchWrapper.put(`${this.baseUrl}/${executionId}/cancel`);
	}

	// Mock step generation (to be removed when backend API is ready)
	private generateMockSteps(execution: Execution): ExecutionStep[] {
		const steps: ExecutionStep[] = [];
		const stepTypes = ["trigger", "action", "condition", "action"];
		const stepNames = [
			"Webhook Trigger",
			"HTTP Request",
			"Check Response",
			"Log Result",
		];

		for (let i = 0; i < stepTypes.length; i++) {
			const stepStartTime = new Date(execution.started_at);
			stepStartTime.setMilliseconds(stepStartTime.getMilliseconds() + i * 1000);

			let status: ExecutionStep["status"] = "pending";
			let completedAt: string | undefined;
			let executionTimeMs = 0;
			let errorMessage: string | undefined;

			// Determine step status based on execution status and step index
			if (execution.status === "completed") {
				status = "completed";
				completedAt = new Date(
					stepStartTime.getTime() + 800 + i * 200
				).toISOString();
				executionTimeMs = 800 + i * 200;
			} else if (execution.status === "failed") {
				if (i === 0) {
					status = "completed";
					completedAt = new Date(stepStartTime.getTime() + 800).toISOString();
					executionTimeMs = 800;
				} else if (i === 1) {
					status = "failed";
					completedAt = new Date(stepStartTime.getTime() + 1200).toISOString();
					executionTimeMs = 1200;
					errorMessage = "HTTP request failed: Connection timeout";
				} else {
					status = "pending";
				}
			} else if (execution.status === "running") {
				if (i === 0) {
					status = "completed";
					completedAt = new Date(stepStartTime.getTime() + 800).toISOString();
					executionTimeMs = 800;
				} else if (i === 1) {
					status = "running";
					executionTimeMs = Date.now() - stepStartTime.getTime();
				} else {
					status = "pending";
				}
			}

			steps.push({
				id: `step-${execution.id}-${i}`,
				execution_id: execution.id,
				step_name: stepNames[i],
				step_type: stepTypes[i],
				status,
				input_data: {
					step_index: i,
					previous_output: i > 0 ? `Output from step ${i}` : undefined,
					config: {
						timeout: 30_000,
						retries: 3,
					},
				},
				output_data:
					status === "completed"
						? {
								success: true,
								result: `Step ${i + 1} completed successfully`,
								timestamp: completedAt,
								data: {
									processed: true,
									value: Math.random() * 100,
								},
							}
						: {},
				error_message: errorMessage,
				execution_time_ms: executionTimeMs,
				started_at: stepStartTime.toISOString(),
				completed_at: completedAt,
				created_at: stepStartTime.toISOString(),
			});
		}

		return steps;
	}

	// Real-time execution monitoring
	async subscribeToExecution(
		executionId: string,
		callback: (execution: ExecutionWithSteps) => void
	): Promise<() => void> {
		// For now, use polling. Later we can implement WebSocket
		const interval = setInterval(async () => {
			try {
				const execution = await this.getExecutionDetails(executionId);
				callback(execution);

				// Stop polling if execution is complete
				if (["completed", "failed", "cancelled"].includes(execution.status)) {
					clearInterval(interval);
				}
			} catch (error) {
				console.error("Failed to fetch execution details:", error);
			}
		}, 1000);

		return () => clearInterval(interval);
	}

	// Execute workflow manually
	async executeWorkflow(
		workflowId: string,
		triggerData?: Record<string, any>
	): Promise<Execution> {
		return fetchWrapper.post(`/api/workflows/${workflowId}/execute`, {
			trigger_data: triggerData || {},
		});
	}
}

export const executionService = new ExecutionService();
export type { ExecutionStep, ExecutionWithSteps };
