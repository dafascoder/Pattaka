import { Link } from "@tanstack/react-router";
import { Bolt, Github, Lightbulb } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const Header = () => {
	return (
		<header className="sticky top-0 z-50 flex w-full items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex w-full items-center justify-between p-4">
				<div className="flex items-center gap-2">
					<Lightbulb className="h-7 w-7 text-primary" />
					<span className="hidden font-semibold text-lg sm:inline-block">
						Voltig
					</span>
				</div>
				<div className="flex items-center gap-3">
					<ThemeToggle />
					<Button
						asChild
						className="hidden gap-2 md:flex"
						size="sm"
						variant="outline"
					>
						<Link to="/login">Login</Link>
					</Button>
					<Button asChild size="sm">
						<Link to="/register">Get Started</Link>
					</Button>
				</div>
			</div>
		</header>
	);
};

export default Header;
