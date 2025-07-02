import { IconCloudUpload } from "@tabler/icons-react";
import React from "react";
import type { PaletteItem } from "@/components/builder/nodes/types";

export const httpActionConfig: PaletteItem = {
	id: "http-action",
	name: "HTTP Request",
	type: "action",
	subType: "http",
	icon: <IconCloudUpload className="h-5 w-5" />,
	description: "Make HTTP requests to external APIs and services.",
	color: "text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100",
	category: "actions",
	config: {
		defaultSettings: {
			method: "GET",
			timeout: 30_000,
		},
		requiredFields: ["url", "method"],
		optionalFields: ["headers", "body", "timeout", "authentication"],
	},
};
