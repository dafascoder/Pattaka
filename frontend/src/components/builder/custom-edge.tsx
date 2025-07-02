import { IconPlus } from "@tabler/icons-react";
import {
	BaseEdge,
	EdgeLabelRenderer,
	type EdgeProps,
	getBezierPath,
} from "@xyflow/react";
import { Button } from "@/components/ui/button";

export function CustomEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	markerEnd,
	data,
}: EdgeProps) {
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	return (
		<>
			<BaseEdge markerEnd={markerEnd} path={edgePath} style={style} />
			<EdgeLabelRenderer>
				<div
					className="nodrag nopan"
					style={{
						position: "absolute",
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						fontSize: 12,
						pointerEvents: "all",
					}}
				>
					<Button
						className="h-6 w-6 rounded-full"
						onClick={(event) => {
							data?.onEdgeClick?.(event, id);
						}}
						size="icon"
					>
						<IconPlus className="h-4 w-4" />
					</Button>
				</div>
			</EdgeLabelRenderer>
		</>
	);
}
