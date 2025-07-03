// API Types based on backend models

export interface APIResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export interface User {
	id: string;
	email: string;
	name: string;
	emailVerified: boolean;
	image: string;
	createdAt: string;
	updatedAt: string;
}

export interface Session {
	id: string;
	token: string;
	userId: string;
	expiresAt: string;
	ipAddress: string;
	userAgent: string;
	createdAt: string;
	updatedAt: string;
}

export interface AuthContext {
	user: User;
	session: Session;
}

export interface Agent {
	id: string;
	name: string;
	description: string;
	config: Record<string, any>;
	status: string;
	user_id: string;
	created_at: string;
	updated_at: string;
}

export interface CreateAgentRequest {
	name: string;
	description?: string;
	config?: Record<string, any>;
	status?: string;
}

export interface UpdateAgentRequest {
	name?: string;
	description?: string;
	config?: Record<string, any>;
	status?: string;
}

// Project Types
export interface Project {
	id: string;
	displayName: string;
	ownerId: string;
	platformId: string;
	notifyStatus: string;
	externalId?: string;
	releasesEnabled: boolean;
	metadata: Record<string, any>;
	created: string;
	updated: string;
}

export interface ProjectUsage {
	id: string;
	displayName: string;
	flowCount: number;
	flowRunCount: number;
	connectionCount: number;
}

export interface CreateProjectRequest {
	displayName: string;
	notifyStatus?: string;
	externalId?: string;
	releasesEnabled?: boolean;
	metadata?: Record<string, any>;
}

export interface UpdateProjectRequest {
	displayName?: string;
	notifyStatus?: string;
	externalId?: string;
	releasesEnabled?: boolean;
	metadata?: Record<string, any>;
}

// Flow Types  
export interface Flow {
	id: string;
	projectId: string;
	folderId?: string;
	folderName?: string;
	status: string;
	schedule?: string;
	created: string;
	updated: string;
}

export interface CreateFlowRequest {
	folderId?: string;
	status?: string;
	schedule?: string;
}

export interface UpdateFlowRequest {
	folderId?: string;
	status?: string;
	schedule?: string;
}

// Flow Version Types
export interface FlowVersion {
	id: string;
	flowId: string;
	version: number;
	displayName: string;
	trigger: Record<string, any>;
	steps: Record<string, any>;
	status: string;
	created: string;
	updated: string;
}

export interface CreateFlowVersionRequest {
	displayName: string;
	trigger: Record<string, any>;
	steps: Record<string, any>;
	status?: string;
}

export interface UpdateFlowVersionRequest {
	displayName?: string;
	trigger?: Record<string, any>;
	steps?: Record<string, any>;
	status?: string;
}

// Flow Run Types
export interface FlowRun {
	id: string;
	flowVersionId: string;
	projectId: string;
	status: string;
	startTime: string;
	finishTime?: string;
	environment: string;
	flowDisplayName?: string;
	flowVersionName?: string;
	flowVersionNumber?: number;
	tags: string[];
	pauseMetadata: Record<string, any>;
	created: string;
	updated: string;
}

export interface ExecuteFlowRequest {
	environment?: string;
	payload?: Record<string, any>;
}

// App Connection Types
export interface AppConnection {
	id: string;
	projectId: string;
	name: string;
	appName: string;
	config: Record<string, any>;
	credentials?: Record<string, any>;
	status: string;
	created_at: string;
	updated_at: string;
}

// Legacy Workflow type for backward compatibility (deprecated)
export interface Workflow {
	id: string;
	user_id: string;
	name: string;
	description: string;
	definition: Record<string, any>;
	version: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface CreateWorkflowRequest {
	name: string;
	description?: string;
	definition: Record<string, any>;
	is_active?: boolean;
}

export interface Integration {
	id: string;
	name: string;
	type: string;
	config: Record<string, any>;
	credentials?: Record<string, any>;
	user_id: string;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface CreateIntegrationRequest {
	name: string;
	type: string;
	config: Record<string, any>;
	credentials?: Record<string, any>;
	is_active?: boolean;
}

export interface Execution {
	id: string;
	workflow_id: string;
	agent_id?: string;
	status: string;
	input_data: Record<string, any>;
	output_data: Record<string, any>;
	error_message?: string;
	execution_time_ms: number;
	started_at: string;
	completed_at?: string;
	created_at: string;
}

export interface ExecutionStep {
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

export interface DashboardStats {
	agents: {
		total: number;
		active: number;
		inactive: number;
	};
	workflows: {
		total: number;
		active: number;
	};
	integrations: {
		total: number;
		active: number;
	};
	executions: {
		total: number;
		running: number;
		completed: number;
		failed: number;
		successRate: number;
	};
}

export interface DashboardData {
	stats: DashboardStats;
	recentExecutions: Execution[];
}

// API Error type
export interface APIError {
	message: string;
	status: number;
	error?: string;
}
