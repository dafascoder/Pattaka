import { IconGitBranch } from "@tabler/icons-react";
import React from "react";
import type { PaletteItem } from "@/components/builder/nodes/types";

export const conditionConfig: PaletteItem = {
	id: "condition",
	name: "Condition",
	type: "condition",
	icon: <IconGitBranch className="h-5 w-5" />,
	description: "Add conditional branching logic to your workflow.",
	color: "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100",
	category: "logic",
	config: {
		requiredFields: ["condition"],
		optionalFields: ["trueLabel", "falseLabel"],
	},
};
