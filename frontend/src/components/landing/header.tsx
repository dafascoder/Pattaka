
import { Button } from "@/components/ui/button";
import { Bolt, Github, Lightbulb } from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import { Link } from "@tanstack/react-router";



const Header = () => {
	return (
		<header className="flex justify-between items-center border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex items-center justify-between p-4 w-full">
				<div className="flex items-center gap-2">
					<Lightbulb className="h-7 w-7 text-primary" />
					<span className="font-semibold text-lg hidden sm:inline-block">Voltig</span>
				</div>
				<div className="flex items-center gap-3">
					<ThemeToggle />
					<Button asChild variant="outline" size="sm" className="hidden md:flex gap-2">
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