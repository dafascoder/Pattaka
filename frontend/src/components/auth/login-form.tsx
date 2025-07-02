import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps extends React.ComponentProps<"form"> {
	onLogin: (email: string, password: string) => void;
	isLoading?: boolean;
}

export function LoginForm({
	className,
	onLogin,
	isLoading = false,
	...props
}: LoginFormProps) {
	const form = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const handleSubmit = (data: LoginFormData) => {
		onLogin(data.email, data.password);
	};

	return (
		<Form {...form}>
			<form
				className={cn("flex flex-col gap-6", className)}
				onSubmit={form.handleSubmit(handleSubmit)}
				{...props}
			>
				<div className="flex flex-col items-center gap-2 text-center">
					<h1 className="font-bold text-2xl">Login to your account</h1>
					<p className="text-balance text-muted-foreground text-sm">
						Enter your email below to login to your account
					</p>
				</div>
				<div className="grid gap-6">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input placeholder="m@example.com" type="email" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<div className="flex items-center">
									<FormLabel>Password</FormLabel>
									<a
										className="ml-auto text-sm underline-offset-4 hover:underline"
										href="#"
									>
										Forgot your password?
									</a>
								</div>
								<FormControl>
									<Input type="password" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button className="w-full" disabled={isLoading} type="submit">
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{isLoading ? "Signing in..." : "Login"}
					</Button>
					<div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
						<span className="relative z-10 bg-background px-2 text-muted-foreground">
							Or continue with
						</span>
					</div>
					<Button className="w-full" variant="outline">
						<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
								fill="currentColor"
							/>
						</svg>
						Login with GitHub
					</Button>
				</div>
				<div className="text-center text-sm">
					Don&apos;t have an account?{" "}
					<Link className="underline underline-offset-4" to="/register">
						Sign up
					</Link>
				</div>
			</form>
		</Form>
	);
}
