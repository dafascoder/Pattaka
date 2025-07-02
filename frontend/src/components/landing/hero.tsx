import { ArrowRight, Play, Workflow, Zap, Users, Shield, Clock, CheckCircle, Palette, Code, Globe, BarChart3, Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Features = () => {
	const features = [
		{
			icon: Palette,
			title: "Drag & Drop Builder",
			description: "Create complex workflows with our intuitive visual editor. No coding required."
		},
		{
			icon: Code,
			title: "500+ Integrations",
			description: "Connect with all your favorite tools including Slack, Gmail, Salesforce, and more."
		},
		{
			icon: Globe,
			title: "Real-time Collaboration",
			description: "Work together with your team in real-time. Share workflows and collaborate seamlessly."
		},
		{
			icon: BarChart3,
			title: "Advanced Analytics",
			description: "Track performance, monitor executions, and optimize your workflows with detailed insights."
		},
		{
			icon: Lock,
			title: "Enterprise Security",
			description: "Bank-level security with SOC 2 compliance, encryption, and advanced access controls."
		},
		{
			icon: Smartphone,
			title: "Mobile Ready",
			description: "Monitor and manage your workflows on the go with our responsive mobile interface."
		}
	];

	return (
		<section id="features" className="py-20 md:py-32 bg-muted/30">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<Badge variant="secondary" className="mb-4">
						Features
					</Badge>
					<h2 className="mb-6 font-bold text-4xl tracking-tight sm:text-5xl">
						Everything you need to 
						<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							{" "}automate smarter
						</span>
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						Powerful features designed to help you build, deploy, and manage workflows 
						that scale with your business needs.
					</p>
				</div>

				<div className="mx-auto mt-16 max-w-6xl">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature, index) => (
							<Card key={index} className="group relative overflow-hidden border-0 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:scale-105">
								<CardHeader>
									<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-300">
										<feature.icon className="h-6 w-6 text-blue-600" />
									</div>
									<CardTitle className="text-xl">{feature.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground">{feature.description}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

const HowItWorks = () => {
	const steps = [
		{
			step: "01",
			title: "Design Your Workflow",
			description: "Use our visual builder to create workflows by dragging and dropping components.",
			color: "from-green-500 to-emerald-500"
		},
		{
			step: "02", 
			title: "Connect Your Tools",
			description: "Integrate with 500+ apps and services. Set up triggers and actions in minutes.",
			color: "from-blue-500 to-cyan-500"
		},
		{
			step: "03",
			title: "Deploy & Monitor",
			description: "Activate your workflows and monitor their performance with real-time analytics.",
			color: "from-purple-500 to-pink-500"
		}
	];

	return (
		<section id="how-it-works" className="py-20 md:py-32">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<Badge variant="secondary" className="mb-4">
						How It Works
					</Badge>
					<h2 className="mb-6 font-bold text-4xl tracking-tight sm:text-5xl">
						Get started in 
						<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							{" "}3 simple steps
						</span>
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						From idea to automation in minutes. Our intuitive platform makes workflow 
						creation accessible to everyone.
					</p>
				</div>

				<div className="mx-auto mt-16 max-w-6xl">
					<div className="grid grid-cols-1 gap-12 md:grid-cols-3">
						{steps.map((step, index) => (
							<div key={index} className="relative">
								<div className="text-center">
									<div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r ${step.color} text-white shadow-lg`}>
										<span className="font-bold text-xl">{step.step}</span>
									</div>
									<h3 className="mb-4 font-semibold text-xl">{step.title}</h3>
									<p className="text-muted-foreground">{step.description}</p>
								</div>
								
								{/* Connection line */}
								{index < steps.length - 1 && (
									<div className="hidden md:block absolute top-8 left-full h-0.5 w-full bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-700" />
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

const Hero = () => {
	return (
		<>
			<section className="relative overflow-hidden py-20 md:py-32">
				{/* Background decoration */}
				<div className="absolute inset-0 -z-10">
					<div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
					<div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl animate-pulse delay-1000" />
					<div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-pink-400/10 blur-3xl animate-pulse delay-2000" />
				</div>

				<div className="relative mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto max-w-4xl text-center">
						{/* Badge */}
						<Badge variant="secondary" className="mb-8 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
							<Workflow className="h-4 w-4" />
							Visual Workflow Automation Platform
						</Badge>

						{/* Main headline */}
						<h1 className="mb-6 font-bold text-5xl tracking-tight sm:text-6xl lg:text-7xl">
							Automate Your Work,
							<span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
								{" "}
								Amplify Your Impact
							</span>
						</h1>

						{/* Subheadline */}
						<p className="mx-auto mb-12 max-w-2xl text-muted-foreground text-xl leading-relaxed">
							Build powerful workflows with our intuitive drag-and-drop interface. 
							Connect your favorite tools, automate repetitive tasks, and focus on what matters most.
						</p>

						{/* CTA buttons */}
						<div className="mb-16 flex flex-col justify-center gap-4 sm:flex-row">
							<Button
								className="group rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-semibold text-lg text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
								size="lg"
							>
								Start Building Free
								<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
							</Button>
							<Button
								className="rounded-xl px-8 py-4 font-semibold text-lg transition-all duration-200 hover:bg-muted"
								size="lg"
								variant="outline"
							>
								<Play className="mr-2 h-5 w-5" />
								Watch Demo
							</Button>
						</div>

						{/* Trust indicators */}
						<div className="mb-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground text-sm">
							<div className="flex items-center gap-2">
								<Shield className="h-4 w-4 text-green-500" />
								Enterprise Security
							</div>
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-blue-500" />
								Used by 10,000+ Teams
							</div>
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-purple-500" />
								Save 20+ Hours/Week
							</div>
							<div className="flex items-center gap-2">
								<Zap className="h-4 w-4 text-yellow-500" />
								99.9% Uptime
							</div>
						</div>
					</div>

					{/* Hero visual */}
					<div className="mx-auto max-w-6xl">
						<div className="relative rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-8 shadow-2xl backdrop-blur-sm border border-white/10">
							<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
							
							{/* Workflow visualization mockup */}
							<div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 h-80">
								{/* Trigger Node */}
								<div className="flex flex-col items-center justify-center">
									<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700 shadow-lg dark:bg-green-900/30 dark:text-green-300">
										<Zap className="h-8 w-8" />
									</div>
									<h3 className="font-semibold text-lg">Trigger</h3>
									<p className="text-center text-muted-foreground text-sm">
										When something happens
									</p>
								</div>

								{/* Action Node */}
								<div className="flex flex-col items-center justify-center">
									<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-lg dark:bg-blue-900/30 dark:text-blue-300">
										<Workflow className="h-8 w-8" />
									</div>
									<h3 className="font-semibold text-lg">Process</h3>
									<p className="text-center text-muted-foreground text-sm">
										Transform your data
									</p>
								</div>

								{/* Result Node */}
								<div className="flex flex-col items-center justify-center">
									<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-700 shadow-lg dark:bg-purple-900/30 dark:text-purple-300">
										<CheckCircle className="h-8 w-8" />
									</div>
									<h3 className="font-semibold text-lg">Action</h3>
									<p className="text-center text-muted-foreground text-sm">
										Get things done
									</p>
								</div>

								{/* Connection lines */}
								<div className="hidden md:block absolute top-1/2 left-1/3 h-0.5 w-1/3 bg-gradient-to-r from-green-400 to-blue-400 -translate-y-1/2" />
								<div className="hidden md:block absolute top-1/2 right-1/3 h-0.5 w-1/3 bg-gradient-to-r from-blue-400 to-purple-400 -translate-y-1/2" />
							</div>
						</div>
					</div>
				</div>
			</section>
			<Features />
			<HowItWorks />
		</>
	);
};

export { Hero, Features, HowItWorks };
export default Hero;
