import { IconClock } from "@tabler/icons-react";
import React from "react";
import type { PaletteItem } from "..";

export const scheduledTriggerConfig: PaletteItem = {
	id: "scheduled-trigger",
	name: "Scheduled Trigger",
	type: "trigger",
	subType: "scheduled",
	icon: <IconClock className="h-5 w-5" />,
	description: "Trigger workflow on a schedule using cron expressions.",
	color:
		"text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
	category: "triggers",
	isDisabled: (hasTrigger) => hasTrigger,
	config: {
		defaultSettings: {
			schedule: "0 9 * * 1", // Every Monday at 9 AM
			timezone: "UTC",
		},
		requiredFields: ["schedule"],
		optionalFields: ["timezone", "description"],
	},
};
