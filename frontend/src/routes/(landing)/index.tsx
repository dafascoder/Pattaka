import { createFileRoute } from "@tanstack/react-router";
import Header from "@/components/landing/header";
import Hero from "@/components/landing/hero";

export const Route = createFileRoute("/(landing)/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<Header />
			<main className="flex-grow">
				<Hero />
			</main>
		</div>
	);
}
