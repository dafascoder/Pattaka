import {
	IconApi,
	IconGitBranch,
	IconLighter,
	IconMail,
	IconRobot,
	IconWebhook,
} from "@tabler/icons-react";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";

interface CustomNodeData {
	label: string;
	nodeType: string;
	config?: {
		name?: string;
		description?: string;
		settings?: Record<string, any>;
	};
}

const nodeInfoMap: {
	[key: string]: { icon: React.ElementType; color: string };
} = {
	trigger: { icon: IconLighter, color: "bg-green-500" },
	agent: { icon: IconRobot, color: "bg-blue-500" },
	api: { icon: IconApi, color: "bg-purple-500" },
	email: { icon: IconMail, color: "bg-orange-500" },
	webhook: { icon: IconWebhook, color: "bg-pink-500" },
	condition: { icon: IconGitBranch, color: "bg-yellow-500" },
	default: { icon: IconLighter, color: "bg-gray-500" },
};

export const CustomNode = memo(
	({ data, selected, id }: NodeProps & { data: CustomNodeData }) => {
		const { icon: Icon, color } =
			nodeInfoMap[data.nodeType] || nodeInfoMap.default;
		const nodeLabel = data.config?.name || data.label;
		const nodeDescription =
			data.config?.description || `This is a ${data.nodeType} node.`;

		return (
			<div
				className={`w-64 rounded-lg bg-white shadow-md transition-all duration-200 ${
					selected ? "ring-2 ring-blue-500 ring-offset-2" : "hover:shadow-lg"
				} border border-gray-200 cursor-pointer`}
			>
				<div className="flex items-center gap-3 p-3">
					<div
						className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md ${color}`}
					>
						<Icon className="h-6 w-6 text-white" />
					</div>
					<div className="flex-1 overflow-hidden">
						<div className="truncate font-semibold text-gray-800">
							{nodeLabel}
						</div>
						<div className="truncate text-gray-500 text-sm">
							{nodeDescription}
						</div>
					</div>
				</div>

				{data.nodeType !== "trigger" && (
					<Handle
						className="!h-4 !w-4 !-translate-y-1/2 !border-2 !border-white !bg-gray-400"
						position={Position.Top}
						type="target"
					/>
				)}
				<Handle
					className="!h-4 !w-4 !translate-y-1/2 !border-2 !border-white !bg-gray-400"
					position={Position.Bottom}
					type="source"
				/>
			</div>
		);
	}
);

CustomNode.displayName = "CustomNode";

export const nodeTypes = {
	customNode: CustomNode,
};
