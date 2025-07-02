import {
	IconApi,
	IconArrowRight,
	IconClock,
	IconGitBranch,
	IconLighter,
	IconMail,
	IconPlayerPlay,
	IconPlus,
	IconRobot,
	IconSettings,
	IconTrash,
	IconVariable,
	IconWebhook,
	IconX,
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
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
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

// Node type configurations
const NODE_TYPE_CONFIGS = {
	trigger: {
		icon: IconLighter,
		color: "emerald",
		label: "Trigger Configuration",
	},
	agent: {
		icon: IconRobot,
		color: "blue",
		label: "Agent Configuration",
	},
	api: {
		icon: IconApi,
		color: "purple",
		label: "API Configuration",
	},
	email: {
		icon: IconMail,
		color: "orange",
		label: "Email Configuration",
	},
	webhook: {
		icon: IconWebhook,
		color: "red",
		label: "Webhook Configuration",
	},
	condition: {
		icon: IconGitBranch,
		color: "amber",
		label: "Condition Configuration",
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
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="trigger-type">
					Trigger Type
				</Label>
				<Select
					onValueChange={(value) => onSettingChange("triggerType", value)}
					value={config.settings.triggerType || "manual"}
				>
					<SelectTrigger className="bg-background">
						<SelectValue placeholder="Select trigger type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="manual">
							<div className="flex items-center gap-2">
								<IconPlayerPlay className="h-4 w-4" />
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
						<SelectItem value="email">
							<div className="flex items-center gap-2">
								<IconMail className="h-4 w-4" />
								Email
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{config.settings.triggerType === "schedule" && (
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="cron">
						Cron Expression
					</Label>
					<Input
						className="bg-background font-mono text-sm"
						id="cron"
						onChange={(e) => onSettingChange("cron", e.target.value)}
						placeholder="0 0 * * *"
						value={config.settings.cron || ""}
					/>
					<p className="text-muted-foreground text-xs">
						Example: 0 0 * * * (daily at midnight)
					</p>
				</div>
			)}
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

function ApiConfig({
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
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label className="font-medium text-sm" htmlFor="url">
						URL
					</Label>
					<Input
						className="bg-background"
						id="url"
						onChange={(e) => onSettingChange("url", e.target.value)}
						placeholder="https://api.example.com"
						value={config.settings.url || ""}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="headers">
					Headers (JSON)
				</Label>
				<Textarea
					className="resize-none bg-background font-mono text-sm"
					id="headers"
					onChange={(e) => onSettingChange("headers", e.target.value)}
					placeholder='{"Authorization": "Bearer token"}'
					rows={3}
					value={config.settings.headers || "{}"}
				/>
			</div>

			<div className="space-y-2">
				<Label className="font-medium text-sm" htmlFor="body">
					Request Body
				</Label>
				<Textarea
					className="resize-none bg-background"
					id="body"
					onChange={(e) => onSettingChange("body", e.target.value)}
					placeholder="Request body (for POST/PUT requests)"
					rows={3}
					value={config.settings.body || ""}
				/>
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
					rows={4}
					value={config.settings.body || ""}
				/>
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
									<SelectItem value="contains">Contains</SelectItem>
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

export function NodeConfigSidebar({
	node,
	nodes,
	selectedNodeId,
	onUpdate,
	onDelete,
	onClose,
}: NodeConfigSidebarProps) {
	const nodeConfig = node?.data?.config as NodeConfig | undefined;
	const [config, setConfig] = useState<NodeConfig>({
		name: nodeConfig?.name || (node?.data?.label as string) || "",
		description: nodeConfig?.description || "",
		settings: nodeConfig?.settings || {},
	});
	const { state } = useSidebar();

	// Sync config when node changes
	useEffect(() => {
		console.log('NodeConfigSidebar: Node changed', {
			nodeId: node?.id,
			hasData: !!node?.data,
			nodeType: node?.data?.nodeType,
			hasConfig: !!node?.data?.config
		});
		
		if (node?.data) {
			const nodeConfig = node.data.config as NodeConfig | undefined;
			setConfig({
				name: nodeConfig?.name || (node.data.label as string) || "",
				description: nodeConfig?.description || "",
				settings: nodeConfig?.settings || {},
			});
		} else {
			// Reset config when no node is selected
			setConfig({
				name: "",
				description: "",
				settings: {},
			});
		}
	}, [node?.id, node?.data?.config, node?.data?.label]); // Dependencies to track changes

	const nodeType = node?.data.nodeType as keyof typeof NODE_TYPE_CONFIGS;
	const nodeTypeConfig = node ? NODE_TYPE_CONFIGS[nodeType] : null;

	const handleConfigChange = (field: string, value: any) => {
		const newConfig = { ...config, [field]: value };
		setConfig(newConfig);
		onUpdate(newConfig);
	};

	const handleSettingChange = (key: string, value: any) => {
		const newSettings = { ...config.settings, [key]: value };
		const newConfig = { ...config, settings: newSettings };
		setConfig(newConfig);
		onUpdate(newConfig);
	};

	const renderNodeTypeSettings = () => {
		if (!node) return null;

		const props = { config, onSettingChange: handleSettingChange };

		switch (nodeType) {
			case "trigger":
				return <TriggerConfig {...props} />;
			case "agent":
				return <AgentConfig {...props} />;
			case "api":
				return <ApiConfig {...props} />;
			case "email":
				return <EmailConfig {...props} />;
			case "webhook":
				return <WebhookConfig {...props} />;
			case "condition":
				return <ConditionConfig {...props} />;
			default:
				return (
					<div className="py-8 text-center">
						<p className="text-muted-foreground text-sm">
							No specific settings for this node type
						</p>
					</div>
				);
		}
	};

	// If no node is selected, show a default state
	if (!node) {
		return (
			<Sidebar
				className="sticky top-0 hidden h-svh border-l lg:flex"
				collapsible="none"
			>
				<SidebarContent className="gap-0">
					<SidebarHeader className="border-border/40 border-b bg-muted/30 px-4 py-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<IconSettings className="h-4 w-4" />
								<h3 className="font-semibold text-sm">
									{state === "expanded" ? "Configuration" : ""}
								</h3>
							</div>
							<Button
								className="h-8 w-8"
								onClick={onClose}
								size="icon"
								variant="ghost"
							>
								<IconX className="h-4 w-4" />
							</Button>
						</div>
					</SidebarHeader>

					<div className="flex flex-1 items-center justify-center p-8">
						<div className="space-y-4 text-center">
							<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
								<IconSettings className="h-8 w-8 text-muted-foreground/50" />
							</div>
							{state === "expanded" && (
								<>
									<h3 className="font-medium text-foreground text-sm">
										No Step Selected
									</h3>
									<p className="max-w-[200px] text-muted-foreground text-xs">
										Select a step in your workflow to configure its settings and
										variables.
									</p>
								</>
							)}
						</div>
					</div>
				</SidebarContent>
			</Sidebar>
		);
	}

	return (
		<Sidebar
			className={cn(
				"border-border/40 border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
				"transition-all duration-300 ease-in-out"
			)}
			collapsible="icon"
			side="right"
			variant="sidebar"
		>
			<SidebarContent className="gap-0">
				<SidebarHeader className="border-border/40 border-b bg-muted/30 px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<IconSettings className="h-4 w-4" />
							<h3 className="font-semibold text-sm">
								{state === "expanded"
									? `Step: ${config.name || "Unnamed"}`
									: ""}
							</h3>
						</div>
						<Button
							className="h-8 w-8"
							onClick={onClose}
							size="icon"
							variant="ghost"
						>
							<IconX className="h-4 w-4" />
						</Button>
					</div>
				</SidebarHeader>

				{/* Basic Configuration */}
				<SidebarGroup className="px-2 py-3">
					<SidebarGroupLabel className="px-2 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
						Basic Settings
					</SidebarGroupLabel>
					<SidebarGroupContent className="mt-2 px-2">
						<div className="space-y-4">
							<div className="space-y-2">
								<Label className="font-medium text-sm" htmlFor="node-name">
									Step Title
								</Label>
								<Input
									className="bg-background"
									id="node-name"
									onChange={(e) => handleConfigChange("name", e.target.value)}
									value={config.name}
								/>
							</div>

							<div className="space-y-2">
								<Label
									className="font-medium text-sm"
									htmlFor="node-description"
								>
									Step Description
								</Label>
								<Textarea
									className="resize-none bg-background"
									id="node-description"
									onChange={(e) =>
										handleConfigChange("description", e.target.value)
									}
									rows={3}
									value={config.description}
								/>
							</div>
						</div>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Node Type Specific Configuration */}
				{nodeTypeConfig && (
					<SidebarGroup className="border-border/20 border-t px-2 py-3">
						<SidebarGroupLabel className="flex items-center gap-2 px-2 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
							<nodeTypeConfig.icon className="h-3 w-3" />
							{nodeTypeConfig.label}
						</SidebarGroupLabel>
						<SidebarGroupContent className="mt-2 px-2">
							<Card
								className={cn(
									"border transition-all duration-200",
									`border-${nodeTypeConfig.color}-200 bg-${nodeTypeConfig.color}-50/30`
								)}
							>
								<CardContent className="p-4">
									{renderNodeTypeSettings()}
								</CardContent>
							</Card>
						</SidebarGroupContent>
					</SidebarGroup>
				)}

				{/* Variables Configuration */}
				<SidebarGroup className="border-border/20 border-t px-2 py-3">
					<SidebarGroupLabel className="flex items-center gap-2 px-2 font-semibold text-muted-foreground/80 text-xs uppercase tracking-wider">
						<IconVariable className="h-3 w-3" />
						Variables
					</SidebarGroupLabel>
					<SidebarGroupContent className="mt-2 px-2">
						<Card className="border-slate-200 bg-slate-50/30">
							<CardContent className="space-y-6 p-4">
								<VariableManager
									nodes={nodes}
									onChange={(variables) =>
										handleSettingChange("inputVariables", variables)
									}
									selectedNodeId={selectedNodeId || undefined}
									type="input"
									variables={config.settings.inputVariables || []}
								/>

								<Separator />

								<VariableManager
									onChange={(variables) =>
										handleSettingChange("outputVariables", variables)
									}
									type="output"
									variables={config.settings.outputVariables || []}
								/>
							</CardContent>
						</Card>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Delete Action */}
				<SidebarGroup className="mt-auto border-border/20 border-t px-2 py-3">
					<SidebarGroupContent className="px-2">
						<Button
							className="h-9 w-full"
							onClick={onDelete}
							size="sm"
							variant="destructive"
						>
							<IconTrash className="mr-2 h-4 w-4" />
							{state === "expanded" ? "Delete Step" : ""}
						</Button>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
