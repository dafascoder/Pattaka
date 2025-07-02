import { IconExternalLink, IconRocket, IconWand } from "@tabler/icons-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute(
	"/(authenticated)/dashboard/_layout/builder"
)({
	component: BuilderRedirect,
});

function BuilderRedirect() {
	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="font-bold text-3xl">Workflow Builder</h1>
				<p className="text-muted-foreground">
					Design and create powerful automation workflows for your agents
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<Card className="border-2 border-primary/20 border-dashed bg-primary/5">
					<CardHeader>
						<div className="flex items-center gap-2">
							<IconWand className="h-5 w-5 text-primary" />
							<CardTitle>Visual Builder</CardTitle>
						</div>
						<CardDescription>
							Create workflows using our intuitive drag-and-drop interface
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link to="/dashboard/workflows">
							<Button className="w-full">
								Manage Workflows
								<IconExternalLink className="ml-2 h-4 w-4" />
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<IconRocket className="h-5 w-5 text-orange-500" />
							<CardTitle>Quick Start</CardTitle>
						</div>
						<CardDescription>
							Get started with pre-built workflow templates
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button className="w-full" disabled variant="outline">
							Browse Templates
							<span className="ml-2 text-muted-foreground text-xs">
								(Coming Soon)
							</span>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<IconExternalLink className="h-5 w-5 text-blue-500" />
							<CardTitle>Import Workflow</CardTitle>
						</div>
						<CardDescription>
							Import existing workflows from files or other sources
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button className="w-full" disabled variant="outline">
							Import Workflow
							<span className="ml-2 text-muted-foreground text-xs">
								(Coming Soon)
							</span>
						</Button>
					</CardContent>
				</Card>
			</div>

			<div className="rounded-lg bg-muted/50 p-6">
				<h3 className="mb-2 font-semibold">Why use the dedicated builder?</h3>
				<ul className="space-y-1 text-muted-foreground text-sm">
					<li>• Full-screen canvas for complex workflows</li>
					<li>• Better performance with large diagrams</li>
					<li>• Advanced controls and minimap</li>
					<li>• Collapsible component palette</li>
					<li>• Real-time drag and drop functionality</li>
				</ul>
			</div>
		</div>
	);
}
