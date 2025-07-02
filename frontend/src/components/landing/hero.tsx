import { ArrowRight, Play, Shield, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
	return (
		<section className="hero-pattern relative overflow-hidden py-16 md:py-24">
			{/* Background decoration */}
			<div className="-z-10 -translate-x-1/2 absolute top-20 left-1/2 h-[500px] w-[500px] animate-pulse-slow rounded-full bg-gradient-to-br from-primary/30 to-accent/30 opacity-50 blur-[100px]" />

			<div className="relative mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-4xl text-center">
					{/* Badge */}
					<div className="mb-8 inline-flex items-center rounded-full bg-blue-100 px-4 py-2 font-medium text-blue-800 text-sm">
						<Zap className="mr-2 h-4 w-4" />
						Enterprise-Grade AI Agent Builder
					</div>

					{/* Main headline */}
					<h1 className="mb-6 font-bold text-5xl text-gray-900 tracking-tight sm:text-6xl lg:text-7xl">
						Empower Every Employee to
						<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							{" "}
							Build AI Agents
						</span>
					</h1>

					{/* Subheadline */}
					<p className="mx-auto mb-10 max-w-2xl text-gray-600 text-xl leading-relaxed">
						Transform repetitive business processes into intelligent automation.
						No coding required. Enterprise security built-in. Seamless
						integration with your existing tools.
					</p>

					{/* CTA buttons */}
					<div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
						<Button
							className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-lg text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl"
							size="lg"
						>
							Start Building Agents
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
						<Button
							className="rounded-xl border-2 border-gray-300 px-8 py-4 font-semibold text-lg transition-all duration-200 hover:bg-gray-50"
							size="lg"
							variant="outline"
						>
							<Play className="mr-2 h-5 w-5" />
							Watch Demo
						</Button>
					</div>

					{/* Trust indicators */}
					<div className="flex flex-wrap items-center justify-center gap-8 text-gray-500 text-sm">
						<div className="flex items-center">
							<Shield className="mr-2 h-4 w-4 text-green-500" />
							SOC 2 Compliant
						</div>
						<div className="flex items-center">
							<Users className="mr-2 h-4 w-4 text-blue-500" />
							10,000+ Active Users
						</div>
						<div className="flex items-center">
							<Zap className="mr-2 h-4 w-4 text-purple-500" />
							99.9% Uptime SLA
						</div>
					</div>
				</div>

				{/* Hero image placeholder */}
				<div className="mx-auto mt-16 max-w-5xl">
					<div className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-2 shadow-2xl">
						<div className="flex h-96 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
							<p className="font-medium text-white text-xl">
								Platform Dashboard Preview
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Hero;
