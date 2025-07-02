import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
	const [theme, setTheme] = useState<"light" | "dark">("light");

	// Check for system preference on initial load
	useEffect(() => {
		const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;

		const initialTheme = savedTheme || (isDark ? "dark" : "light");
		setTheme(initialTheme);

		if (initialTheme === "dark") {
			document.documentElement.classList.add("dark");
		}
	}, []);

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
		localStorage.setItem("theme", newTheme);

		if (newTheme === "dark") {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	};

	return (
		<Button
			aria-label="Toggle theme"
			className="rounded-full"
			onClick={toggleTheme}
			size="icon"
			variant="outline"
		>
			{theme === "dark" ? (
				<Sun className="h-[1.2rem] w-[1.2rem]" />
			) : (
				<Moon className="h-[1.2rem] w-[1.2rem]" />
			)}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
};

export default ThemeToggle;
