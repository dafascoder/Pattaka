import { Link } from "@tanstack/react-router";
import { GitBranch, Github } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const Header = () => {
	return (
		<header className="sticky top-0 z-50 flex w-full items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex w-full items-center justify-between p-4">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
						<GitBranch className="h-5 w-5 text-white" />
					</div>
					<span className="hidden font-bold text-xl text-foreground sm:inline-block">
						Pattaka
					</span>
				</div>
				<nav className="hidden items-center gap-6 md:flex">
					<a href="#features" className="font-medium text-muted-foreground transition-colors hover:text-foreground">
						Features
					</a>
					<a href="#how-it-works" className="font-medium text-muted-foreground transition-colors hover:text-foreground">
						How it Works
					</a>
					<a href="#pricing" className="font-medium text-muted-foreground transition-colors hover:text-foreground">
						Pricing
					</a>
				</nav>
				<div className="flex items-center gap-3">
					<ThemeToggle />
					<Button
						asChild
						className="hidden gap-2 md:flex"
						size="sm"
						variant="outline"
					>
						<Link to="/login">Sign In</Link>
					</Button>
					<Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
						<Link to="/register">Start Free</Link>
					</Button>
				</div>
			</div>
		</header>
	);
};

export default Header;
