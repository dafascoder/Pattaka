import { IconCode } from "@tabler/icons-react";
import React from "react";
import type { PaletteItem } from "@/components/builder/nodes/types";

export const logActionConfig: PaletteItem = {
	id: "log-action",
	name: "Log Message",
	type: "action",
	subType: "log",
	icon: <IconCode className="h-5 w-5" />,
	description: "Log messages for debugging and monitoring workflows.",
	color: "text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100",
	category: "actions",
	config: {
		defaultSettings: {
			level: "info",
		},
		requiredFields: ["message"],
		optionalFields: ["level", "data"],
	},
};
