import { IconWebhook } from "@tabler/icons-react";
import React from "react";
import type { PaletteItem } from "@/components/builder/nodes/types";

export const webhookTriggerConfig: PaletteItem = {
	id: "webhook-trigger",
	name: "Webhook Trigger",
	type: "trigger",
	subType: "webhook",
	icon: <IconWebhook className="h-5 w-5" />,
	description: "Trigger workflow via HTTP webhook endpoint.",
	color:
		"text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
	category: "triggers",
	isDisabled: (hasTrigger) => hasTrigger,
	config: {
		defaultSettings: {
			method: "POST",
			authentication: "none",
		},
		optionalFields: ["method", "authentication", "headers"],
	},
};
