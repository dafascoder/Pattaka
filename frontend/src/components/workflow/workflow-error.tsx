import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WorkflowErrorProps {
	title?: string;
	message?: string;
	onRetry?: () => void;
	isRetrying?: boolean;
}

export function WorkflowError({
	title = "Failed to load workflows",
	message = "There was an error loading your workflows. Please try again.",
	onRetry,
	isRetrying = false,
}: WorkflowErrorProps) {
	return (
		<Card className="border-red-200 bg-red-50/50">
			<CardContent className="pt-6">
				<div className="flex flex-col items-center justify-center space-y-4 text-center">
					<div className="rounded-full bg-red-100 p-3">
						<IconAlertCircle className="h-6 w-6 text-red-600" />
					</div>

					<div className="space-y-2">
						<h3 className="font-semibold text-lg text-red-900">{title}</h3>
						<p className="max-w-md text-red-700">{message}</p>
					</div>

					{onRetry && (
						<Button
							className="border-red-300 text-red-700 hover:bg-red-100"
							disabled={isRetrying}
							onClick={onRetry}
							variant="outline"
						>
							{isRetrying ? (
								<>
									<IconRefresh className="mr-2 h-4 w-4 animate-spin" />
									Retrying...
								</>
							) : (
								<>
									<IconRefresh className="mr-2 h-4 w-4" />
									Try Again
								</>
							)}
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
