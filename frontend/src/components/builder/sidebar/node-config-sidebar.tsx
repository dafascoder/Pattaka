import {
	IconApi,
	IconArrowRight,
	IconCalculator,
	IconClock,
	IconCloud,
	IconCode,
	IconDatabase,
	IconFile,
	IconGitBranch,
	IconLighter,
	IconMail,
	IconMessage,
	IconMouse,
	IconPlayerPlay,
	IconPlus,
	IconRobot,
	IconSettings,
	IconTrash,
	IconVariable,
	IconWebhook,
	IconX,
	IconCopy,
	IconEye,
	IconEyeOff,
} from "@tabler/icons-react";
import type { Node } from "@xyflow/react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Types
interface NodeConfig {
	name: string;
	description: string;
	settings: Record<string, any>;
}

interface Variable {
	name: string;
	type: "string" | "number" | "boolean" | "object" | "array";
}

interface InputVariable extends Variable {
	sourceNode: string;
	sourceVariable: string;
}

interface NodeConfigSidebarProps {
	node: Node | null;
	nodes: Node[];
	selectedNodeId: string | null;
	onUpdate: (config: any) => void;
	onDelete: () => void;
	onClose: () => void;
}

// Enhanced node type configurations with better categorization
const NODE_TYPE_CONFIGS = {
	// Triggers
	trigger: {
		icon: IconLighter,
		color: "emerald",
		label: "Trigger Configuration",
		category: "Flow Control",
	},
	manual: {
		icon: IconMouse,
		color: "blue",
		label: "Manual Trigger",
		category: "Triggers",
	},
	schedule: {
		icon: IconClock,
		color: "purple",
		label: "Schedule Trigger",
		category: "Triggers",
	},
	webhook: {
		icon: IconWebhook,
		color: "pink",
		label: "Webhook Trigger",
		category: "Triggers",
	},
	
	// Actions - Communication
	email: {
		icon: IconMail,
		color: "orange",
		label: "Email Configuration",
		category: "Communication",
	},
	slack: {
		icon: IconMessage,
		color: "green",
		label: "Slack Configuration",
		category: "Communication",
	},
	
	// Actions - Data & APIs
	http: {
		icon: IconApi,
		color: "purple",
		label: "HTTP Request",
		category: "Data & APIs",
	},
	api: {
		icon: IconApi,
		color: "purple",
		label: "API Configuration",
		category: "Data & APIs",
	},
	database: {
		icon: IconDatabase,
		color: "indigo",
		label: "Database Configuration",
		category: "Data & APIs",
	},
	
	// Actions - AI & Automation
	openai: {
		icon: IconRobot,
		color: "blue",
		label: "OpenAI Configuration",
		category: "AI & Automation",
	},
	agent: {
		icon: IconRobot,
		color: "blue",
		label: "Agent Configuration",
		category: "AI & Automation",
	},
	
	// Actions - Files & Data
	file: {
		icon: IconFile,
		color: "gray",
		label: "File Operations",
		category: "Files & Data",
	},
	
	// Actions - Utilities
	calculator: {
		icon: IconCalculator,
		color: "cyan",
		label: "Calculator",
		category: "Utilities",
	},
	
	// Flow Control
	condition: {
		icon: IconGitBranch,
		color: "amber",
		label: "Condition Configuration",
		category: "Flow Control",
	},
	code: {
		icon: IconCode,
		color: "slate",
		label: "Code Configuration",
		category: "Development",
	},
	
	// Cloud Services
	cloud: {
		icon: IconCloud,
		color: "sky",
		label: "Cloud Service",
		category: "Cloud Services",
	},
} as const;

// Component for Variable Management
interface VariableManagerProps {
	variables: Variable[];
	type: "input" | "output";
	nodes?: Node[];
	selectedNodeId?: string;
	onChange: (variables: Variable[]) => void;
}

function VariableManager({
	variables,
	type,
	nodes,
	selectedNodeId,
	onChange,
}: VariableManagerProps) {
	const addVariable = () => {
		const newVar =
			type === "input"
				? {
						name: "",
						type: "string" as const,
						sourceNode: "",
						sourceVariable: "",
					}
				: { name: "", type: "string" as const };
		onChange([...variables, newVar]);
	};

	const updateVariable = (index: number, updates: Partial<Variable>) => {
		const newVariables = [...variables];
		newVariables[index] = { ...newVariables[index], ...updates };
		onChange(newVariables);
	};

	const removeVariable = (index: number) => {
		onChange(variables.filter((_, i) => i !== index));
	};

	const colorClass = type === "input" ? "blue" : "green";

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label className="font-medium text-sm capitalize">
					{type} Variables
				</Label>
				<Button
					className="h-7 px-2"
					onClick={addVariable}
					size="sm"
					variant="outline"
				>
					<IconPlus className="mr-1 h-3 w-3" />
					Add
				</Button>
			</div>

			<div className="space-y-2">
				{variables.map((variable, index) => (
					<Card
						className={cn(
							"transition-all duration-200 hover:shadow-sm",
							type === "input"
								? "border-blue-100 bg-blue-50/30"
								: "border-green-100 bg-green-50/30"
						)}
						key={index}
					>
						<CardContent className="space-y-3 p-3">
							<div className="flex items-center gap-2">
								<Input
									className="h-8 flex-1 bg-background"
									onChange={(e) =>
										updateVariable(index, { name: e.target.value })
									}
									placeholder="Variable name"
									value={variable.name}
								/>
								<Select
									onValueChange={(value: any) =>
										updateVariable(index, { type: value })
									}
									value={variable.type}
								>
									<SelectTrigger className="h-8 w-20 bg-background">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="string">str</SelectItem>
										<SelectItem value="number">num</SelectItem>
										<SelectItem value="boolean">bool</SelectItem>
										<SelectItem value="object">obj</SelectItem>
										<SelectItem value="array">arr</SelectItem>
									</SelectContent>
								</Select>
								<Button
									className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
									onClick={() => removeVariable(index)}
									size="sm"
									variant="ghost"
								>
									<IconX className="h-3 w-3" />
								</Button>
							</div>

							{type === "input" && nodes && selectedNodeId && (
								<div className="flex items-center gap-2 text-muted-foreground text-xs">
									<span className="whitespace-nowrap">Source:</span>
									<Select
										onValueChange={(value) =>
											updateVariable(index, {
												sourceNode: value,
												sourceVariable: "",
											} as any)
										}
										value={(variable as InputVariable).sourceNode || ""}
									>
										<SelectTrigger className="h-7 flex-1 bg-background">
											<SelectValue placeholder="Select node" />
										</SelectTrigger>
										<SelectContent>
											{nodes
												.filter((n) => n.id !== selectedNodeId)
												.map((sourceNode) => (
													<SelectItem key={sourceNode.id} value={sourceNode.id}>
														{(sourceNode.data.config as any)?.name ||
															sourceNode.data.label ||
															`Node ${sourceNode.id}`}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
									{(variable as InputVariable).sourceNode && (
										<>
											<IconArrowRight className="h-3 w-3 opacity-50" />
											<Select
												onValueChange={(value) =>
													updateVariable(index, {
														sourceVariable: value,
													} as any)
												}
												value={(variable as InputVariable).sourceVariable || ""}
											>
												<SelectTrigger className="h-7 flex-1 bg-background">
													<SelectValue placeholder="Select variable" />
												</SelectTrigger>
												<SelectContent>
													{(() => {
														const sourceNode = nodes.find(
															(n) =>
																n.id === (variable as InputVariable).sourceNode
														);
														const outputVars =
															(sourceNode?.data?.config as any)?.settings
																?.outputVariables || [];
														return outputVars.map(
															(outputVar: any, varIndex: number) => (
																<SelectItem
																	key={varIndex}
																	value={outputVar.name}
																>
																	{outputVar.name} ({outputVar.type})
																</SelectItem>
															)
														);
													})()}
												</SelectContent>
											</Select>
										</>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				))}

				{variables.length === 0 && (
					<div className="rounded-lg border-2 border-border border-dashed py-6 text-center text-muted-foreground text-sm">
						No {type} variables defined
					</div>
				)}
			</div>
		</div>
	);
}

// Node Type Specific Configuration Components
function TriggerConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	const triggerType = config.settings.pieceType || config.settings.triggerType || 'manual';
	
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="trigger-type">
					Trigger Type
				</Label>
				<Select
					onValueChange={(value) => onSettingChange("triggerType", value)}
					value={triggerType}
				>
					<SelectTrigger className="bg-background">
						<SelectValue placeholder="Select trigger type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="manual">
							<div className="flex items-center gap-2">
								<IconMouse className="h-4 w-4" />
								Manual
							</div>
						</SelectItem>
						<SelectItem value="schedule">
							<div className="flex items-center gap-2">
								<IconClock className="h-4 w-4" />
								Scheduled
							</div>
						</SelectItem>
						<SelectItem value="webhook">
							<div className="flex items-center gap-2">
								<IconWebhook className="h-4 w-4" />
								Webhook
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{triggerType === "schedule" && (
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="cron">
						Cron Expression
					</Label>
					<Input
						className="bg-background font-mono text-sm"
						id="cron"
						onChange={(e) => onSettingChange("cronExpression", e.target.value)}
						placeholder="0 9 * * * (daily at 9 AM)"
						value={config.settings.cronExpression || ""}
					/>
					<p className="text-muted-foreground text-xs">
						Examples: 0 9 * * * (daily at 9 AM), 0 */6 * * * (every 6 hours)
					</p>
				</div>
			)}

			{triggerType === "webhook" && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="font-medium text-sm" htmlFor="webhook-path">
							Webhook Path
						</Label>
						<Input
							className="bg-background font-mono text-sm"
							id="webhook-path"
							onChange={(e) => onSettingChange("path", e.target.value)}
							placeholder="/webhook"
							value={config.settings.path || ""}
						/>
					</div>
					<div className="space-y-2">
						<Label className="font-medium text-sm" htmlFor="webhook-method">
							HTTP Method
						</Label>
						<Select
							onValueChange={(value) => onSettingChange("method", value)}
							value={config.settings.method || "POST"}
						>
							<SelectTrigger className="bg-background">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="GET">GET</SelectItem>
								<SelectItem value="POST">POST</SelectItem>
								<SelectItem value="PUT">PUT</SelectItem>
								<SelectItem value="PATCH">PATCH</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			)}
		</div>
	);
}

function HttpConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="method">
						Method
					</Label>
					<Select
						onValueChange={(value) => onSettingChange("method", value)}
						value={config.settings.method || "GET"}
					>
						<SelectTrigger className="bg-background">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="GET">GET</SelectItem>
							<SelectItem value="POST">POST</SelectItem>
							<SelectItem value="PUT">PUT</SelectItem>
							<SelectItem value="DELETE">DELETE</SelectItem>
							<SelectItem value="PATCH">PATCH</SelectItem>
							<SelectItem value="HEAD">HEAD</SelectItem>
							<SelectItem value="OPTIONS">OPTIONS</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="timeout">
						Timeout (seconds)
					</Label>
					<Input
						className="bg-background"
						id="timeout"
						type="number"
						onChange={(e) => onSettingChange("timeout", parseInt(e.target.value) || 30)}
						placeholder="30"
						value={config.settings.timeout || ""}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="url">
					URL
				</Label>
				<Input
					className="bg-background"
					id="url"
					onChange={(e) => onSettingChange("url", e.target.value)}
					placeholder="https://api.example.com/endpoint"
					value={config.settings.url || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="headers">
					Headers (JSON)
				</Label>
				<Textarea
					className="resize-none bg-background font-mono text-sm"
					id="headers"
					onChange={(e) => onSettingChange("headers", e.target.value)}
					placeholder='{\n  "Authorization": "Bearer token",\n  "Content-Type": "application/json"\n}'
					rows={4}
					value={config.settings.headers || "{}"}
				/>
			</div>

			{(config.settings.method === "POST" || config.settings.method === "PUT" || config.settings.method === "PATCH") && (
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="body">
						Request Body
					</Label>
					<Textarea
						className="resize-none bg-background font-mono text-sm"
						id="body"
						onChange={(e) => onSettingChange("body", e.target.value)}
						placeholder='{\n  "key": "value"\n}'
						rows={4}
						value={config.settings.body || ""}
					/>
				</div>
			)}

			<div className="flex items-center space-x-2">
				<Switch
					id="follow-redirects"
					checked={config.settings.followRedirects ?? true}
					onCheckedChange={(checked) => onSettingChange("followRedirects", checked)}
				/>
				<Label htmlFor="follow-redirects" className="text-sm">
					Follow redirects
				</Label>
			</div>
		</div>
	);
}

function EmailConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="to">
						To
					</Label>
					<Input
						className="bg-background"
						id="to"
						onChange={(e) => onSettingChange("to", e.target.value)}
						placeholder="recipient@example.com"
						value={config.settings.to || ""}
					/>
				</div>
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="from">
						From
					</Label>
					<Input
						className="bg-background"
						id="from"
						onChange={(e) => onSettingChange("from", e.target.value)}
						placeholder="sender@example.com"
						value={config.settings.from || ""}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="subject">
					Subject
				</Label>
				<Input
					className="bg-background"
					id="subject"
					onChange={(e) => onSettingChange("subject", e.target.value)}
					placeholder="Email subject"
					value={config.settings.subject || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="message">
					Message
				</Label>
				<Textarea
					className="resize-none bg-background"
					id="message"
					onChange={(e) => onSettingChange("body", e.target.value)}
					placeholder="Email message content..."
					rows={6}
					value={config.settings.body || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="cc">
					CC (optional)
				</Label>
				<Input
					className="bg-background"
					id="cc"
					onChange={(e) => onSettingChange("cc", e.target.value)}
					placeholder="cc@example.com"
					value={config.settings.cc || ""}
				/>
			</div>

			<div className="flex items-center space-x-2">
				<Switch
					id="html-format"
					checked={config.settings.isHtml ?? false}
					onCheckedChange={(checked) => onSettingChange("isHtml", checked)}
				/>
				<Label htmlFor="html-format" className="text-sm">
					HTML format
				</Label>
			</div>
		</div>
	);
}

function DatabaseConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="db-type">
					Database Type
				</Label>
				<Select
					onValueChange={(value) => onSettingChange("dbType", value)}
					value={config.settings.dbType || "postgres"}
				>
					<SelectTrigger className="bg-background">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="postgres">PostgreSQL</SelectItem>
						<SelectItem value="mysql">MySQL</SelectItem>
						<SelectItem value="sqlite">SQLite</SelectItem>
						<SelectItem value="mongodb">MongoDB</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="connection-string">
					Connection String
				</Label>
				<Input
					className="bg-background font-mono text-sm"
					id="connection-string"
					onChange={(e) => onSettingChange("connectionString", e.target.value)}
					placeholder="postgres://user:password@host:port/database"
					type="password"
					value={config.settings.connectionString || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="query">
					SQL Query
				</Label>
				<Textarea
					className="resize-none bg-background font-mono text-sm"
					id="query"
					onChange={(e) => onSettingChange("query", e.target.value)}
					placeholder="SELECT * FROM users WHERE active = true"
					rows={4}
					value={config.settings.query || ""}
				/>
			</div>

			<div className="flex items-center space-x-2">
				<Switch
					id="read-only"
					checked={config.settings.readOnly ?? true}
					onCheckedChange={(checked) => onSettingChange("readOnly", checked)}
				/>
				<Label htmlFor="read-only" className="text-sm">
					Read-only query
				</Label>
			</div>
		</div>
	);
}

function OpenAIConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="api-key">
					API Key
				</Label>
				<Input
					className="bg-background font-mono text-sm"
					id="api-key"
					onChange={(e) => onSettingChange("apiKey", e.target.value)}
					placeholder="sk-..."
					type="password"
					value={config.settings.apiKey || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="model">
					Model
				</Label>
				<Select
					onValueChange={(value) => onSettingChange("model", value)}
					value={config.settings.model || "gpt-4o-mini"}
				>
					<SelectTrigger className="bg-background">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="gpt-4o">GPT-4o</SelectItem>
						<SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
						<SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
						<SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="prompt">
					Prompt
				</Label>
				<Textarea
					className="resize-none bg-background"
					id="prompt"
					onChange={(e) => onSettingChange("prompt", e.target.value)}
					placeholder="You are a helpful assistant..."
					rows={4}
					value={config.settings.prompt || ""}
				/>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="temperature">
						Temperature
					</Label>
					<Input
						className="bg-background"
						id="temperature"
						type="number"
						min="0"
						max="2"
						step="0.1"
						onChange={(e) => onSettingChange("temperature", parseFloat(e.target.value) || 0.7)}
						placeholder="0.7"
						value={config.settings.temperature || ""}
					/>
				</div>
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="max-tokens">
						Max Tokens
					</Label>
					<Input
						className="bg-background"
						id="max-tokens"
						type="number"
						onChange={(e) => onSettingChange("maxTokens", parseInt(e.target.value) || 1000)}
						placeholder="1000"
						value={config.settings.maxTokens || ""}
					/>
				</div>
			</div>
		</div>
	);
}

function SlackConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="webhook-url">
					Webhook URL
				</Label>
				<Input
					className="bg-background font-mono text-sm"
					id="webhook-url"
					onChange={(e) => onSettingChange("webhookUrl", e.target.value)}
					placeholder="https://hooks.slack.com/services/..."
					type="password"
					value={config.settings.webhookUrl || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="channel">
					Channel
				</Label>
				<Input
					className="bg-background"
					id="channel"
					onChange={(e) => onSettingChange("channel", e.target.value)}
					placeholder="#general"
					value={config.settings.channel || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="username">
					Username
				</Label>
				<Input
					className="bg-background"
					id="username"
					onChange={(e) => onSettingChange("username", e.target.value)}
					placeholder="Workflow Bot"
					value={config.settings.username || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="message">
					Message
				</Label>
				<Textarea
					className="resize-none bg-background"
					id="message"
					onChange={(e) => onSettingChange("text", e.target.value)}
					placeholder="Hello from the workflow!"
					rows={4}
					value={config.settings.text || ""}
				/>
			</div>
		</div>
	);
}

function FileConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="operation">
					Operation
				</Label>
				<Select
					onValueChange={(value) => onSettingChange("operation", value)}
					value={config.settings.operation || "read"}
				>
					<SelectTrigger className="bg-background">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="read">Read File</SelectItem>
						<SelectItem value="write">Write File</SelectItem>
						<SelectItem value="append">Append to File</SelectItem>
						<SelectItem value="delete">Delete File</SelectItem>
						<SelectItem value="copy">Copy File</SelectItem>
						<SelectItem value="move">Move File</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="file-path">
					File Path
				</Label>
				<Input
					className="bg-background font-mono text-sm"
					id="file-path"
					onChange={(e) => onSettingChange("filePath", e.target.value)}
					placeholder="/path/to/file.txt"
					value={config.settings.filePath || ""}
				/>
			</div>

			{(config.settings.operation === "write" || config.settings.operation === "append") && (
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="content">
						Content
					</Label>
					<Textarea
						className="resize-none bg-background font-mono text-sm"
						id="content"
						onChange={(e) => onSettingChange("content", e.target.value)}
						placeholder="File content..."
						rows={4}
						value={config.settings.content || ""}
					/>
				</div>
			)}

			{(config.settings.operation === "copy" || config.settings.operation === "move") && (
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="destination">
						Destination Path
					</Label>
					<Input
						className="bg-background font-mono text-sm"
						id="destination"
						onChange={(e) => onSettingChange("destinationPath", e.target.value)}
						placeholder="/path/to/destination.txt"
						value={config.settings.destinationPath || ""}
					/>
				</div>
			)}

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="encoding">
					Encoding
				</Label>
				<Select
					onValueChange={(value) => onSettingChange("encoding", value)}
					value={config.settings.encoding || "utf8"}
				>
					<SelectTrigger className="bg-background">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="utf8">UTF-8</SelectItem>
						<SelectItem value="ascii">ASCII</SelectItem>
						<SelectItem value="base64">Base64</SelectItem>
						<SelectItem value="binary">Binary</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

function CalculatorConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="operation">
					Operation
				</Label>
				<Select
					onValueChange={(value) => onSettingChange("operation", value)}
					value={config.settings.operation || "add"}
				>
					<SelectTrigger className="bg-background">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="add">Addition (+)</SelectItem>
						<SelectItem value="subtract">Subtraction (-)</SelectItem>
						<SelectItem value="multiply">Multiplication (×)</SelectItem>
						<SelectItem value="divide">Division (÷)</SelectItem>
						<SelectItem value="power">Power (^)</SelectItem>
						<SelectItem value="sqrt">Square Root</SelectItem>
						<SelectItem value="abs">Absolute Value</SelectItem>
						<SelectItem value="round">Round</SelectItem>
						<SelectItem value="floor">Floor</SelectItem>
						<SelectItem value="ceil">Ceiling</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="value1">
						Value 1
					</Label>
					<Input
						className="bg-background"
						id="value1"
						type="number"
						onChange={(e) => onSettingChange("value1", parseFloat(e.target.value) || 0)}
						placeholder="0"
						value={config.settings.value1 || ""}
					/>
				</div>
				{!["sqrt", "abs", "round", "floor", "ceil"].includes(config.settings.operation) && (
					<div className="space-y-2">
						<Label className="font-medium text-sm" htmlFor="value2">
							Value 2
						</Label>
						<Input
							className="bg-background"
							id="value2"
							type="number"
							onChange={(e) => onSettingChange("value2", parseFloat(e.target.value) || 0)}
							placeholder="0"
							value={config.settings.value2 || ""}
						/>
					</div>
				)}
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="precision">
					Decimal Precision
				</Label>
				<Input
					className="bg-background"
					id="precision"
					type="number"
					min="0"
					max="10"
					onChange={(e) => onSettingChange("precision", parseInt(e.target.value) || 2)}
					placeholder="2"
					value={config.settings.precision || ""}
				/>
			</div>
		</div>
	);
}

function CodeConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="language">
					Language
				</Label>
				<Select
					onValueChange={(value) => onSettingChange("language", value)}
					value={config.settings.language || "javascript"}
				>
					<SelectTrigger className="bg-background">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="javascript">JavaScript</SelectItem>
						<SelectItem value="python">Python</SelectItem>
						<SelectItem value="typescript">TypeScript</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="code">
					Code
				</Label>
				<Textarea
					className="resize-none bg-background font-mono text-sm"
					id="code"
					onChange={(e) => onSettingChange("code", e.target.value)}
					placeholder="// Your code here\nreturn { result: 'Hello World!' };"
					rows={8}
					value={config.settings.code || ""}
				/>
			</div>

			<div className="flex items-center space-x-2">
				<Switch
					id="async-execution"
					checked={config.settings.async ?? false}
					onCheckedChange={(checked) => onSettingChange("async", checked)}
				/>
				<Label htmlFor="async-execution" className="text-sm">
					Async execution
				</Label>
			</div>
		</div>
	);
}

function AgentConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="agent-name">
					Agent Name
				</Label>
				<Input
					className="bg-background"
					id="agent-name"
					onChange={(e) => onSettingChange("agentName", e.target.value)}
					placeholder="My Agent"
					value={config.settings.agentName || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="agent-instructions">
					Instructions
				</Label>
				<Textarea
					className="resize-none bg-background"
					id="agent-instructions"
					onChange={(e) => onSettingChange("instructions", e.target.value)}
					placeholder="You are a helpful assistant."
					rows={4}
					value={config.settings.instructions || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="agent-model">
					Model
				</Label>
				<Select
					onValueChange={(value) => onSettingChange("model", value)}
					value={config.settings.model || 'openai("gpt-4o-mini")'}
				>
					<SelectTrigger className="bg-background">
						<SelectValue placeholder="Select model" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='openai("gpt-4o-mini")'>GPT-4o Mini</SelectItem>
						<SelectItem value='openai("gpt-4o")'>GPT-4o</SelectItem>
						<SelectItem value='openai("gpt-3.5-turbo")'>
							GPT-3.5 Turbo
						</SelectItem>
						<SelectItem value='anthropic("claude-3-sonnet-20240229")'>
							Claude 3 Sonnet
						</SelectItem>
						<SelectItem value='anthropic("claude-3-haiku-20240307")'>
							Claude 3 Haiku
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}

function WebhookConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="webhook-url">
					Webhook URL
				</Label>
				<Input
					className="bg-background"
					id="webhook-url"
					onChange={(e) => onSettingChange("url", e.target.value)}
					placeholder="https://hooks.example.com/webhook"
					value={config.settings.url || ""}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="payload">
					Payload (JSON)
				</Label>
				<Textarea
					className="resize-none bg-background font-mono text-sm"
					id="payload"
					onChange={(e) => onSettingChange("payload", e.target.value)}
					placeholder='{"message": "Hello from workflow"}'
					rows={4}
					value={config.settings.payload || "{}"}
				/>
			</div>
		</div>
	);
}

function ConditionConfig({
	config,
	onSettingChange,
}: {
	config: NodeConfig;
	onSettingChange: (key: string, value: any) => void;
}) {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="condition-type">
					Condition Type
				</Label>
				<Select
					onValueChange={(value) => onSettingChange("conditionType", value)}
					value={config.settings.conditionType || "simple"}
				>
					<SelectTrigger className="bg-background">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="simple">Simple Condition</SelectItem>
						<SelectItem value="expression">JavaScript Expression</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{config.settings.conditionType === "simple" ? (
				<div className="space-y-3">
					<div className="space-y-2">
						<Label className="font-medium text-sm" htmlFor="field">
							Field
						</Label>
						<Input
							className="bg-background"
							id="field"
							onChange={(e) => onSettingChange("field", e.target.value)}
							placeholder="field_name"
							value={config.settings.field || ""}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label className="font-medium text-sm" htmlFor="operator">
								Operator
							</Label>
							<Select
								onValueChange={(value) => onSettingChange("operator", value)}
								value={config.settings.operator || "equals"}
							>
								<SelectTrigger className="bg-background">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="equals">Equals</SelectItem>
									<SelectItem value="not_equals">Not Equals</SelectItem>
									<SelectItem value="greater_than">Greater Than</SelectItem>
									<SelectItem value="less_than">Less Than</SelectItem>
									<SelectItem value="greater_equal">Greater or Equal</SelectItem>
									<SelectItem value="less_equal">Less or Equal</SelectItem>
									<SelectItem value="contains">Contains</SelectItem>
									<SelectItem value="starts_with">Starts With</SelectItem>
									<SelectItem value="ends_with">Ends With</SelectItem>
									<SelectItem value="is_empty">Is Empty</SelectItem>
									<SelectItem value="is_not_empty">Is Not Empty</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label className="font-medium text-sm" htmlFor="value">
								Value
							</Label>
							<Input
								className="bg-background"
								id="value"
								onChange={(e) => onSettingChange("value", e.target.value)}
								placeholder="comparison value"
								value={config.settings.value || ""}
							/>
						</div>
					</div>
				</div>
			) : (
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="expression">
						JavaScript Expression
					</Label>
					<Textarea
						className="resize-none bg-background font-mono text-sm"
						id="expression"
						onChange={(e) => onSettingChange("expression", e.target.value)}
						placeholder="data.status === 'active' && data.count > 10"
						rows={3}
						value={config.settings.expression || ""}
					/>
				</div>
			)}
		</div>
	);
}

// Helper function to get the correct configuration component
function getConfigComponent(stepType: string, pieceType?: string) {
	// Determine the node type for configuration
	const nodeType = pieceType || stepType?.toLowerCase();
	
	switch (nodeType) {
		case 'trigger':
		case 'manual':
		case 'schedule':
		case 'webhook':
			return TriggerConfig;
		case 'http':
		case 'api':
			return HttpConfig;
		case 'email':
			return EmailConfig;
		case 'database':
		case 'sql':
		case 'postgres':
		case 'mysql':
			return DatabaseConfig;
		case 'openai':
		case 'anthropic':
		case 'llm':
			return OpenAIConfig;
		case 'slack':
		case 'discord':
		case 'teams':
			return SlackConfig;
		case 'file':
		case 'csv':
		case 'json':
			return FileConfig;
		case 'calculator':
		case 'math':
			return CalculatorConfig;
		case 'code':
			return CodeConfig;
		case 'agent':
			return AgentConfig;
		case 'condition':
		case 'branch':
			return ConditionConfig;
		default:
			return null;
	}
}



// Main NodeConfigSidebar component
export function NodeConfigSidebar({
	node,
	nodes,
	selectedNodeId,
	onUpdate,
	onDelete,
	onClose,
}: NodeConfigSidebarProps) {
	const [config, setConfig] = useState<NodeConfig>({
		name: "",
		description: "",
		settings: {},
	});
	// Update config when node changes
	useEffect(() => {
		if (node?.data) {
			const nodeData = node.data as any;
			setConfig({
				name: nodeData.displayName || nodeData.stepName || "",
				description: nodeData.description || "",
				settings: nodeData.settings || {},
			});
		}
	}, [node]);

	if (!node || !selectedNodeId) {
		return null;
	}

	const nodeData = node.data as any;
	const stepType = nodeData.stepType || "action";
	const pieceType = nodeData.settings?.pieceType;
	const nodeTypeKey = (pieceType || stepType).toLowerCase();
	const nodeTypeConfig = NODE_TYPE_CONFIGS[nodeTypeKey as keyof typeof NODE_TYPE_CONFIGS] || NODE_TYPE_CONFIGS.trigger;

	const Icon = nodeTypeConfig.icon;
	const ConfigComponent = getConfigComponent(stepType, pieceType);

	const handleSettingChange = (key: string, value: any) => {
		const updatedSettings = { ...config.settings, [key]: value };
		const updatedConfig = { ...config, settings: updatedSettings };
		setConfig(updatedConfig);
		
		// Update the node data
		onUpdate({
			...node.data,
			settings: updatedSettings,
		});
	};

	const handleBasicChange = (field: keyof NodeConfig, value: string) => {
		const updatedConfig = { ...config, [field]: value };
		setConfig(updatedConfig);
		
		// Update the node data
		onUpdate({
			...node.data,
			[field === 'name' ? 'displayName' : field]: value,
		});
	};

	const handleSkipToggle = () => {
		const skip = !config.settings.skip;
		handleSettingChange("skip", skip);
	};

	const handleCopyNode = () => {
		// TODO: Implement copy functionality
		console.log("Copy node:", node.id);
	};

	const handleDeleteNode = () => {
		onDelete();
		onClose();
	};



	return (
		<div className="h-full flex flex-col bg-background border-l">
			{/* Header */}
			<div className="flex-shrink-0 p-4 border-b bg-muted/30">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<div className={cn("p-1.5 rounded-md", nodeTypeConfig.color)}>
							<Icon className="h-4 w-4" />
						</div>
						<div>
							<h3 className="font-semibold text-sm">{nodeTypeConfig.label}</h3>
							<p className="text-muted-foreground text-xs">{nodeTypeConfig.category}</p>
						</div>
					</div>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleSkipToggle}
							className="h-7 w-7 p-0"
							title={config.settings.skip ? "Enable step" : "Skip step"}
						>
							{config.settings.skip ? (
								<IconEyeOff className="h-3 w-3" />
							) : (
								<IconEye className="h-3 w-3" />
							)}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCopyNode}
							className="h-7 w-7 p-0"
							title="Copy node"
						>
							<IconCopy className="h-3 w-3" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="h-7 w-7 p-0"
						>
							<IconX className="h-3 w-3" />
						</Button>
					</div>
				</div>

				{/* Status indicators */}
				<div className="flex items-center gap-2">
					{config.settings.skip && (
						<Badge variant="secondary" className="text-xs">
							<IconEyeOff className="h-3 w-3 mr-1" />
							Skipped
						</Badge>
					)}
					<Badge variant="outline" className="text-xs">
						{stepType === 'trigger' ? 'Trigger' : 'Action'}
					</Badge>
					{pieceType && (
						<Badge variant="outline" className="text-xs">
							{pieceType}
						</Badge>
					)}
				</div>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-4 space-y-6">
					{/* Basic Settings */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm flex items-center gap-2">
								<IconSettings className="h-4 w-4" />
								Basic Settings
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label className="font-medium text-sm" htmlFor="node-name">
									Display Name
								</Label>
								<Input
									className="bg-background"
									id="node-name"
									value={config.name}
									onChange={(e) => handleBasicChange("name", e.target.value)}
									placeholder="Enter display name"
								/>
							</div>
							<div className="space-y-2">
								<Label className="font-medium text-sm" htmlFor="node-description">
									Description
								</Label>
								<Textarea
									className="resize-none bg-background"
									id="node-description"
									value={config.description}
									onChange={(e) => handleBasicChange("description", e.target.value)}
									placeholder="Enter description (optional)"
									rows={2}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Type-specific Configuration */}
					{ConfigComponent && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm flex items-center gap-2">
									<Icon className="h-4 w-4" />
									Configuration
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ConfigComponent
									config={config}
									onSettingChange={handleSettingChange}
								/>
							</CardContent>
						</Card>
					)}

					{/* Variable Management */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-sm flex items-center gap-2">
								<IconVariable className="h-4 w-4" />
								Variables
							</CardTitle>
						</CardHeader>
						<CardContent>
							<VariableManager
								variables={config.settings.inputVariables || []}
								type="input"
								nodes={nodes}
								selectedNodeId={selectedNodeId || undefined}
								onChange={(vars) => handleSettingChange("inputVariables", vars)}
							/>
							<Separator className="my-4" />
							<VariableManager
								variables={config.settings.outputVariables || []}
								type="output"
								onChange={(vars) => handleSettingChange("outputVariables", vars)}
							/>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Footer */}
			<div className="flex-shrink-0 p-4 border-t bg-muted/30">
				<div className="flex items-center justify-between">
					<Button
						variant="outline"
						size="sm"
						onClick={handleCopyNode}
						className="flex items-center gap-2"
					>
						<IconCopy className="h-3 w-3" />
						Duplicate
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={handleDeleteNode}
						className="flex items-center gap-2"
					>
						<IconTrash className="h-3 w-3" />
						Delete
					</Button>
				</div>
			</div>
		</div>
	);
}
