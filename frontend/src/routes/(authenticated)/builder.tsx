import { createFileRoute } from "@tanstack/react-router";
import { BuilderLayout } from "@/components/builder/builder-layout";

export const Route = createFileRoute("/(authenticated)/builder")({
	component: RouteComponent,
});

function RouteComponent() {
	return <BuilderLayout />;
}
