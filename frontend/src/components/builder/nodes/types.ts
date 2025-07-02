import type { Connection, Edge } from "@xyflow/react";
import type { ReactNode } from "react";

// Node types
export type NodeType =
	| "trigger"
	| "agent"
	| "api"
	| "email"
	| "webhook"
	| "condition"
	| "default"
	| "function"
	| "action";

export type TriggerType = "manual" | "scheduled" | "webhook";
export type ActionType = "http" | "log" | "email" | "agent";

type Variable = {
	name: string;
	type: "string" | "number" | "boolean" | "object" | "array";
};

export type Node = {
	id: string;
	type: NodeType;
	data: {
		label: string;
		nodeType: NodeType;
		subType?: TriggerType | ActionType;
	};
	className?: string;
	style?: React.CSSProperties;
	position?: {
		x: number;
		y: number;
	};
	selected?: boolean;
	dragging?: boolean;
	draggable?: boolean;
	config?: {
		name?: string;
		description?: string;
		settings?: Record<string, any>;
	};
	inputs?: Variable[];
	outputs?: Variable[];
	edges?: Edge[];
	connections?: Connection[];
};

export type PaletteItem = {
	id: string;
	name: string;
	type: NodeType;
	subType?: TriggerType | ActionType;
	icon: ReactNode;
	description: string;
	color: string;
	category: "triggers" | "actions" | "logic" | "integrations";
	isDisabled?: (hasTrigger: boolean) => boolean;
	config?: {
		defaultSettings?: Record<string, any>;
		requiredFields?: string[];
		optionalFields?: string[];
	};
};

export type Agent = {
	id: string;
	name: string;
	description?: string;
	type?: string;
};
