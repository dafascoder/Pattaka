import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LoginForm } from "@/components/auth/login-form";
import { login } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
});

function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const handleLogin = async (email: string, password: string) => {
		setIsLoading(true);

		try {
			await login(email, password);
			toast.success("Login successful!");
			navigate({ to: "/dashboard" });
		} catch (error) {
			// Handle unexpected errors
			console.error("Login error:", error);
			toast.error("Login failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<a className="flex items-center gap-2 font-medium" href="#">
						<div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
							<Lightbulb className="size-4" />
						</div>
						Pattaka
					</a>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<LoginForm isLoading={isLoading} onLogin={handleLogin} />
					</div>
				</div>
			</div>
			<div className="relative hidden bg-muted lg:block">
				<img
					alt="Image"
					className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
					src="/placeholder.svg"
				/>
			</div>
		</div>
	)
}
