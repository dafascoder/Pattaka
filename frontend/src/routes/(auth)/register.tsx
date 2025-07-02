import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RegisterForm } from "@/components/auth/register-form";
import { register as registerUser } from "@/lib/auth-client";

export const Route = createFileRoute("/(auth)/register")({
	component: SignupPage,
});

function SignupPage() {
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const handleRegister = async (
		email: string,
		name: string,
		password: string
	) => {
		setIsLoading(true);

		try {
			await registerUser(name, email, password);
			toast.success("Registration successful!");
			navigate({ to: "/dashboard" });
		} catch (error) {
			// Handle unexpected errors
			console.error("Registration error:", error);
			toast.error("Registration failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="grid min-h-svh lg:grid-cols-2">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<a className="flex items-center gap-2 font-medium" href="#">
						<div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
							<Lightbulb className="size-4" />
						</div>
						Voltig
					</a>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<RegisterForm isLoading={isLoading} onRegister={handleRegister} />
					</div>
				</div>
			</div>
		</div>
	);
}
