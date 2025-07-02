import { IconPlayerPlay } from "@tabler/icons-react";
import React from "react";
import type { PaletteItem } from "@/components/builder/nodes/types";
import { useHasTrigger } from "@/stores/workflow-builder-store";

export const manualTriggerConfig: PaletteItem = {
	id: "manual-trigger",
	name: "Manual Trigger",
	type: "trigger",
	subType: "manual",
	icon: <IconPlayerPlay className="h-5 w-5" />,
	description: "Trigger workflow manually with a button click.",
	color:
		"text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
	category: "triggers",
	isDisabled: (hasTrigger) => hasTrigger,
	config: {
		defaultSettings: {
			buttonText: "Run Workflow",
			confirmRequired: false,
		},
		optionalFields: ["buttonText", "confirmRequired", "description"],
	},
};
