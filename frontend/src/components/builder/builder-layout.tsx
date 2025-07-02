import { Outlet } from "@tanstack/react-router";
import type { Edge, Node } from "@xyflow/react";
import { useState } from "react";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { BuilderHeader } from "./builder-header";
import { BuilderSidebar } from "./sidebar/builder-sidebar";
import { NodeConfigSidebar } from "./sidebar/node-config-sidebar";
import { WorkflowBuilder } from "./workflow-builder";

interface BuilderLayoutProps {
	// Optional props that can be passed from parent components
	selectedNode?: Node | null;
	nodes?: Node[];
	edges?: Edge[];
	onNodeUpdate?: (nodeId: string, config: any) => void;
	onNodeDelete?: (nodeId: string) => void;
	onNodesChange?: (nodes: Node[]) => void;
	onEdgesChange?: (edges: Edge[]) => void;
}

export function BuilderLayout({
	selectedNode: externalSelectedNode,
	nodes: externalNodes,
	edges: externalEdges,
	onNodeUpdate: externalOnNodeUpdate,
	onNodeDelete: externalOnNodeDelete,
	onNodesChange: externalOnNodesChange,
	onEdgesChange: externalOnEdgesChange,
}: BuilderLayoutProps = {}) {
	// Internal state for node selection, nodes, and edges if not provided externally
	const [internalSelectedNode, setInternalSelectedNode] = useState<Node | null>(
		null
	);
	const [internalNodes, setInternalNodes] = useState<Node[]>([]);
	const [internalEdges, setInternalEdges] = useState<Edge[]>([]);

	// Use external props if provided, otherwise use internal state
	const selectedNode = externalSelectedNode ?? internalSelectedNode;
	const nodes = externalNodes ?? internalNodes;
	const edges = externalEdges ?? internalEdges;

	const handleNodeSelection = (node: Node | null) => {
		console.log('BuilderLayout: Node selection changed', {
			selectedNode: node,
			nodeId: node?.id,
			nodeType: node?.data?.nodeType,
			hasExternalSelectedNode: !!externalSelectedNode
		});
		
		if (!externalSelectedNode) {
			setInternalSelectedNode(node);
		}
	};

	const handleNodesChange = (updatedNodes: Node[]) => {
		if (externalOnNodesChange) {
			externalOnNodesChange(updatedNodes);
		} else {
			setInternalNodes(updatedNodes);
		}
	};

	const handleEdgesChange = (updatedEdges: Edge[]) => {
		if (externalOnEdgesChange) {
			externalOnEdgesChange(updatedEdges);
		} else {
			setInternalEdges(updatedEdges);
		}
	};

	const handleNodeUpdate = (config: any) => {
		if (selectedNode) {
			if (externalOnNodeUpdate) {
				externalOnNodeUpdate(selectedNode.id, config);
			} else {
				// Internal update logic if no external handler provided
				const updatedNodes = nodes.map((node) =>
					node.id === selectedNode.id
						? { ...node, data: { ...node.data, config } }
						: node
				);
				setInternalNodes(updatedNodes);

				// Update the selected node with new config to maintain selection
				const updatedSelectedNode = updatedNodes.find(
					(node) => node.id === selectedNode.id
				);
				if (updatedSelectedNode) {
					setInternalSelectedNode(updatedSelectedNode);
				}
			}
		}
	};

	// Keep selected node reference updated when nodes change externally
	const currentSelectedNode = selectedNode
		? nodes.find((node) => node.id === selectedNode.id) || selectedNode
		: null;

	console.log('BuilderLayout: Current state', {
		hasSelectedNode: !!selectedNode,
		selectedNodeId: selectedNode?.id,
		hasCurrentSelectedNode: !!currentSelectedNode,
		currentSelectedNodeId: currentSelectedNode?.id,
		totalNodes: nodes.length
	});

	const handleNodeDelete = () => {
		if (selectedNode) {
			if (externalOnNodeDelete) {
				externalOnNodeDelete(selectedNode.id);
			} else {
				// Internal delete logic if no external handler provided
				const updatedNodes = nodes.filter(
					(node) => node.id !== selectedNode.id
				);
				setInternalNodes(updatedNodes);
				setInternalSelectedNode(null);
			}
		}
	};

	const handleCloseConfig = () => {
		if (!externalSelectedNode) {
			setInternalSelectedNode(null);
		}
	};

	return (
		<div className="flex h-screen">
			<SidebarProvider>
				<BuilderSidebar />
				<SidebarInset className="flex flex-1 flex-col">
					<BuilderHeader workflowName="Workflow Builder" />
					<div className="flex-1">
						<WorkflowBuilder
							edges={edges}
							nodes={nodes}
							onEdgesChange={handleEdgesChange}
							onNodeSelection={handleNodeSelection}
							onNodesChange={handleNodesChange}
							selectedNodeId={selectedNode?.id || null}
						/>
					</div>
				</SidebarInset>
				{/* Always render NodeConfigSidebar */}
				<NodeConfigSidebar
					node={currentSelectedNode}
					nodes={nodes}
					onClose={handleCloseConfig}
					onDelete={handleNodeDelete}
					onUpdate={handleNodeUpdate}
					selectedNodeId={currentSelectedNode?.id || null}
				/>
			</SidebarProvider>
		</div>
	);
}
