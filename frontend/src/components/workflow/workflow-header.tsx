import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface WorkflowHeaderProps {
	onCreateClick: () => void;
}

export function WorkflowHeader({ onCreateClick }: WorkflowHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<div>
				<h1 className="font-bold text-3xl tracking-tight">Workflows</h1>
				<p className="text-muted-foreground">
					Manage and monitor your automation workflows
				</p>
			</div>
			<Button onClick={onCreateClick}>
				<IconPlus className="mr-2 h-4 w-4" />
				New Workflow
			</Button>
		</div>
	);
}
