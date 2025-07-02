import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { toast } from "sonner";
import { DefaultCatchBoundary } from "@/components/default-catch-boundary";
import { NotFound } from "@/components/not-found";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				refetchOnReconnect: () => !queryClient.isMutating(),
			},
		},
		mutationCache: new MutationCache({
			onError: (error) => {
				toast(error.message, { className: "bg-red-500 text-white" });
			},
			onSettled: () => {
				if (queryClient.isMutating() === 1) {
					return queryClient.invalidateQueries();
				}
			},
		}),
	});

	const router = routerWithQueryClient(
		createTanStackRouter({
			routeTree,
			defaultPreload: "intent",
			defaultErrorComponent: DefaultCatchBoundary,
			defaultNotFoundComponent: () => <NotFound />,
			scrollRestoration: true,
			context: {
				queryClient,
			},
		}),
		queryClient
	);

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}
