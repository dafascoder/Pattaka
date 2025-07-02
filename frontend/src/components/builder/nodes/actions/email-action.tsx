import { IconMail } from "@tabler/icons-react";
import React from "react";
import type { PaletteItem } from "@/components/builder/nodes/types";

export const emailActionConfig: PaletteItem = {
	id: "email-action",
	name: "Send Email",
	type: "email",
	icon: <IconMail className="h-5 w-5" />,
	description: "Send emails with custom content and attachments.",
	color: "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100",
	category: "actions",
	config: {
		requiredFields: ["to", "subject", "body"],
		optionalFields: ["from", "cc", "bcc", "attachments", "template"],
	},
};
