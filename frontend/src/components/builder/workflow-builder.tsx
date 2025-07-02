import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	Background,
	type Connection,
	Controls,
	type Edge,
	type EdgeChange,
	type Node,
	type NodeChange,
	type OnConnect,
	type OnEdgesChange,
	type OnNodesChange,
	ReactFlow,
	type ReactFlowInstance,
	ReactFlowProvider,
} from "@xyflow/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import { IconBolt, IconMouse } from "@tabler/icons-react";
import { toast } from "sonner";
import { WorkflowExecutionOverlay } from "@/components/debug/workflow-execution-overlay";
import { nodeTypes } from "./node-types";

const initialEdges: Edge[] = [];

interface WorkflowBuilderProps {
	nodes?: Node[];
	edges?: Edge[];
	selectedNodeId?: string | null;
	onNodesChange?: (nodes: Node[]) => void;
	onEdgesChange?: (edges: Edge[]) => void;
	onNodeSelection?: (node: Node | null) => void;
	// Debug props
	executionId?: string | null;
	showExecutionOverlay?: boolean;
	workflowId?: string;
}

function WorkflowBuilderContent({
	nodes: externalNodes,
	edges: externalEdges,
	selectedNodeId: externalSelectedNodeId,
	onNodesChange: externalOnNodesChange,
	onEdgesChange: externalOnEdgesChange,
	onNodeSelection,
	// Debug props
	executionId,
	showExecutionOverlay = false,
	workflowId,
}: WorkflowBuilderProps) {
	// Listen for workflow errors and show toast notifications
	useEffect(() => {
		const handleWorkflowError = (event: CustomEvent) => {
			const { message, type = "error" } = event.detail;
			if (type === "warning") {
				toast.warning(message);
			} else {
				toast.error(message);
			}
		};

		window.addEventListener(
			"workflow-error",
			handleWorkflowError as EventListener
		);
		return () => {
			window.removeEventListener(
				"workflow-error",
				handleWorkflowError as EventListener
			);
		};
	}, []);
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const [internalNodes, setInternalNodes] = useState<Node[]>([]);
	const [internalEdges, setInternalEdges] = useState<Edge[]>([]);
	const [reactFlowInstance, setReactFlowInstance] =
		useState<ReactFlowInstance | null>(null);

	// Use external props if provided, otherwise use internal state
	const nodes = externalNodes ?? internalNodes;
	const edges = externalEdges ?? internalEdges;

	// Check if there's already a trigger node
	const hasTrigger = nodes?.some((node) => node.data.nodeType === "trigger");

	const onNodesChange: OnNodesChange = useCallback(
		(changes: NodeChange[]) => {
			const selectionChange = changes.find((c) => c.type === "select");
			if (selectionChange && selectionChange.type === "select") {
				const selectedNode = selectionChange.selected
					? nodes?.find((node) => node.id === selectionChange.id) || null
					: null;
				
				console.log('WorkflowBuilder: Selection change detected', {
					changeId: selectionChange.id,
					selected: selectionChange.selected,
					foundNode: !!selectedNode,
					nodeId: selectedNode?.id,
					nodeType: selectedNode?.data?.nodeType
				});
				
				onNodeSelection?.(selectedNode);
			}

			const updatedNodes = applyNodeChanges(changes, nodes ?? []);

			if (externalOnNodesChange) {
				externalOnNodesChange(updatedNodes);
			} else {
				setInternalNodes(updatedNodes);
			}
		},
		[nodes, onNodeSelection, externalOnNodesChange]
	);

	const onEdgesChange: OnEdgesChange = useCallback(
		(changes: EdgeChange[]) => {
			const updatedEdges = applyEdgeChanges(changes, edges ?? []);

			if (externalOnEdgesChange) {
				externalOnEdgesChange(updatedEdges);
			} else {
				setInternalEdges(updatedEdges);
			}
		},
		[edges, externalOnEdgesChange]
	);

	const onConnect: OnConnect = useCallback(
		(connection: Connection) => {
			const updatedEdges = addEdge(connection, edges ?? []);

			if (externalOnEdgesChange) {
				externalOnEdgesChange(updatedEdges);
			} else {
				setInternalEdges(updatedEdges);
			}
		},
		[edges, externalOnEdgesChange]
	);

	const onDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault();

			if (!(reactFlowWrapper.current && reactFlowInstance)) {
				return;
			}

			const type = event.dataTransfer.getData("application/reactflow");
			const label = event.dataTransfer.getData("application/reactflow-label");
			const category = event.dataTransfer.getData(
				"application/reactflow-category"
			);

			// check if the dropped element is valid
			if (typeof type === "undefined" || !type) {
				return;
			}

			// Prevent dropping multiple triggers
			if (category === "triggers" && hasTrigger) {
				// Show error feedback
				const errorEvent = new CustomEvent("workflow-error", {
					detail: {
						message:
							"Only one trigger is allowed per workflow. Please remove the existing trigger first.",
						type: "warning",
					},
				});
				window.dispatchEvent(errorEvent);
				return;
			}

			const position = reactFlowInstance.screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			const newNode: Node = {
				id: `${type}-${+new Date()}`,
				type: "customNode",
				position,
				data: { label: `${label}`, nodeType: type },
			};

			const updatedNodes = nodes?.concat(newNode) ?? [newNode];

			if (externalOnNodesChange) {
				externalOnNodesChange(updatedNodes);
			} else {
				setInternalNodes(updatedNodes);
			}
		},
		[reactFlowInstance, nodes, externalOnNodesChange, hasTrigger]
	);

	const onNodeClick = useCallback(
		(event: React.MouseEvent, node: Node) => {
			console.log('WorkflowBuilder: Node clicked directly', {
				nodeId: node.id,
				nodeType: node.data?.nodeType
			});
			onNodeSelection?.(node);
		},
		[onNodeSelection]
	);

	const onPaneClick = useCallback(() => {
		console.log('WorkflowBuilder: Pane clicked - clearing selection');
		onNodeSelection?.(null);
	}, [onNodeSelection]);

	return (
		<div className="relative h-full w-full" ref={reactFlowWrapper}>
			<ReactFlow
				edges={edges}
				fitView
				nodes={nodes}
				nodeTypes={nodeTypes}
				onConnect={onConnect}
				onDragOver={onDragOver}
				onDrop={onDrop}
				onEdgesChange={onEdgesChange}
				onInit={setReactFlowInstance}
				onNodeClick={onNodeClick}
				onNodesChange={onNodesChange}
				onPaneClick={onPaneClick}
			>
				<Controls />
				<Background />
			</ReactFlow>

			{/* Execution Overlay */}
			{showExecutionOverlay && executionId && workflowId && (
				<WorkflowExecutionOverlay
					executionId={executionId}
					isVisible={showExecutionOverlay}
					nodes={nodes || []}
					workflowId={workflowId}
				/>
			)}

			{nodes?.length === 0 && (
				<div className="pointer-events-none absolute inset-0 flex h-full flex-col items-center justify-center p-8 text-center">
					<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-border bg-muted">
						<IconBolt className="text-muted-foreground/70" size={40} />
					</div>
					<h2 className="mb-2 font-semibold text-2xl text-foreground">
						Build Your Workflow
					</h2>
					<p className="mb-6 max-w-sm text-muted-foreground">
						Your canvas is empty. Start by dragging a component from the palette
						on the left.
					</p>
					<div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-2 text-muted-foreground/80 text-sm">
						<IconMouse size={20} />
						<span>Drag and drop to begin</span>
					</div>
				</div>
			)}
		</div>
	);
}

export function WorkflowBuilder(props: WorkflowBuilderProps = {}) {
	return (
		<ReactFlowProvider>
			<WorkflowBuilderContent {...props} />
		</ReactFlowProvider>
	);
}
