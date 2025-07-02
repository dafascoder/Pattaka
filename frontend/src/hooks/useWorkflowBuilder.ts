import { useEffect } from "react";
import type { Agent } from "@/components/builder/nodes/node-types";
import { useWorkflowBuilderStore } from "@/stores/workflow-builder-store";

interface UseWorkflowBuilderOptions {
	agents?: Agent[];
	autoInitialize?: boolean;
	onWorkflowChange?: (workflow: any) => void;
}

export function useWorkflowBuilder(options: UseWorkflowBuilderOptions = {}) {
	const { agents = [], autoInitialize = true, onWorkflowChange } = options;

	// Get store actions separately to avoid dependency issues
	const setAgents = useWorkflowBuilderStore((state) => state.setAgents);
	const exportWorkflow = useWorkflowBuilderStore(
		(state) => state.exportWorkflow
	);
	const importWorkflow = useWorkflowBuilderStore(
		(state) => state.importWorkflow
	);
	const clearWorkflow = useWorkflowBuilderStore((state) => state.clearWorkflow);
	const addNode = useWorkflowBuilderStore((state) => state.addNode);
	const workflow = useWorkflowBuilderStore((state) => state.workflow);

	// Initialize agents when they change - using setAgents directly
	useEffect(() => {
		if (autoInitialize && agents.length > 0) {
			setAgents(agents);
		}
	}, [agents, autoInitialize, setAgents]);

	// Subscribe to workflow changes - simplified subscription
	useEffect(() => {
		if (onWorkflowChange) {
			onWorkflowChange(workflow);
		}
	}, [workflow, onWorkflowChange]);

	// Utility functions with stable references
	const initializeWithAgents = (agentList: Agent[]) => {
		setAgents(agentList);
	};

	const resetWorkflow = () => {
		clearWorkflow();
	};

	const saveWorkflow = () => {
		return exportWorkflow();
	};

	const loadWorkflow = (workflowData: any) => {
		importWorkflow(workflowData);
	};

	// Get computed values directly from selectors
	const isWorkflowEmpty = workflow.nodes.length === 0;
	const isWorkflowValid = workflow.hasTrigger && workflow.nodes.length > 0;
	const workflowStats = {
		nodeCount: workflow.nodes.length,
		edgeCount: workflow.edges.length,
		triggerCount: workflow.nodes.filter((n) => n.data.nodeType === "trigger")
			.length,
		actionCount: workflow.nodes.filter((n) => n.data.nodeType === "action")
			.length,
		agentCount: workflow.nodes.filter((n) => n.data.nodeType === "agent")
			.length,
	};

	return {
		// Direct store selectors - these are safe
		workflow,

		// Actions
		addNode,

		// Utility functions
		initializeWithAgents,
		resetWorkflow,
		saveWorkflow,
		loadWorkflow,

		// Computed values
		isWorkflowEmpty,
		isWorkflowValid,
		workflowStats,
	};
}

// Specialized hooks for specific use cases
export function useWorkflowBuilderActions() {
	return useWorkflowBuilderStore((state) => ({
		addNode: state.addNode,
		removeNode: state.removeNode,
		updateNode: state.updateNode,
		addEdge: state.addEdge,
		removeEdge: state.removeEdge,
		clearWorkflow: state.clearWorkflow,
		setWorkflowInfo: state.setWorkflowInfo,
	}));
}

export function useWorkflowBuilderUI() {
	return useWorkflowBuilderStore((state) => ({
		searchTerm: state.ui.searchTerm,
		setSearchTerm: state.setSearchTerm,
		selectedNodeId: state.ui.selectedNodeId,
		selectNode: state.selectNode,
		sidebarExpanded: state.ui.sidebarExpanded,
		setSidebarExpanded: state.setSidebarExpanded,
		configPanelOpen: state.ui.configPanelOpen,
		setConfigPanelOpen: state.setConfigPanelOpen,
	}));
}

export function useWorkflowBuilderDrag() {
	return useWorkflowBuilderStore((state) => ({
		dragState: state.drag,
		startDrag: state.startDrag,
		endDrag: state.endDrag,
	}));
}
