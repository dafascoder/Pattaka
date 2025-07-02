import { IconRobot } from "@tabler/icons-react";
import { Connection, Edge } from "@xyflow/react";
import React, { memo, ReactNode } from "react";
import { emailActionConfig } from "@/components/builder/nodes/actions/email-action";
import { httpActionConfig } from "@/components/builder/nodes/actions/http-action";
import { logActionConfig } from "@/components/builder/nodes/actions/log-action";
import { conditionConfig } from "@/components/builder/nodes/flow/condition";
import { manualTriggerConfig } from "@/components/builder/nodes/triggers/manual-trigger";
import { scheduledTriggerConfig } from "@/components/builder/nodes/triggers/scheduled-trigger";
import { webhookTriggerConfig } from "@/components/builder/nodes/triggers/webhook-trigger";
import type { Agent, Node, PaletteItem } from "./types";

// Predefined palette items with complete configuration
export const PALETTE_ITEMS: PaletteItem[] = [
	manualTriggerConfig,
	scheduledTriggerConfig,
	webhookTriggerConfig,
	httpActionConfig,
	logActionConfig,
	emailActionConfig,
	conditionConfig,
];

// Utility functions for working with palette items
export function getPaletteItemById(id: string): PaletteItem | undefined {
	return PALETTE_ITEMS.find((item) => item.id === id);
}

export function getPaletteItemsByCategory(
	category: PaletteItem["category"]
): PaletteItem[] {
	return PALETTE_ITEMS.filter((item) => item.category === category);
}

export function createAgentPaletteItem(agent: Agent): PaletteItem {
	return {
		id: `agent-${agent.id}`,
		name: agent.name,
		type: "agent",
		icon: <IconRobot className="h-5 w-5" />,
		description:
			agent.description || "AI agent that can process and respond to inputs.",
		color: "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100",
		category: "actions",
		config: {
			defaultSettings: {
				agentId: agent.id,
				timeout: 60_000,
			},
			requiredFields: ["prompt"],
			optionalFields: ["context", "temperature", "maxTokens"],
		},
	};
}

export function createNodeFromPaletteItem(
	paletteItem: Omit<PaletteItem, "id">,
	position: { x: number; y: number }
): Node {
	return {
		id: "",
		type: paletteItem.type,
		data: {
			label: paletteItem.name,
			nodeType: paletteItem.type,
			subType: paletteItem.subType,
		},
		position,
		config: {
			name: paletteItem.name,
			description: paletteItem.description,
			settings: paletteItem.config?.defaultSettings || {},
		},
		draggable: true,
	};
}
