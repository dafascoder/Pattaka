import { Star, ArrowRight, CheckCircle, Building2, Users, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Testimonials = () => {
	const testimonials = [
		{
			name: "Sarah Chen",
			role: "Operations Manager",
			company: "TechCorp",
			avatar: "/api/placeholder/40/40",
			content: "Pattaka transformed how we handle our daily operations. We've automated 80% of our repetitive tasks and saved countless hours every week.",
			rating: 5
		},
		{
			name: "Michael Rodriguez",
			role: "Marketing Director", 
			company: "GrowthLab",
			avatar: "/api/placeholder/40/40",
			content: "The drag-and-drop interface is incredibly intuitive. Our entire team was up and running within a day, creating complex workflows effortlessly.",
			rating: 5
		},
		{
			name: "Emily Johnson",
			role: "CTO",
			company: "StartupXYZ",
			avatar: "/api/placeholder/40/40",
			content: "Enterprise-grade security with startup-friendly pricing. Pattaka scaled with us from 10 to 200 employees seamlessly.",
			rating: 5
		}
	];

	return (
		<section className="py-20 md:py-32 bg-muted/30">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<Badge variant="secondary" className="mb-4">
						Testimonials
					</Badge>
					<h2 className="mb-6 font-bold text-4xl tracking-tight sm:text-5xl">
						Loved by teams
						<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							{" "}worldwide
						</span>
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						Join thousands of teams who have transformed their workflows with Pattaka.
					</p>
				</div>

				<div className="mx-auto mt-16 max-w-6xl">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						{testimonials.map((testimonial, index) => (
							<Card key={index} className="border-0 bg-background/50 backdrop-blur-sm">
								<CardHeader>
									<div className="flex items-center gap-1 mb-4">
										{[...Array(testimonial.rating)].map((_, i) => (
											<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
										))}
									</div>
									<CardContent className="p-0">
										<p className="text-muted-foreground mb-6 italic">
											"{testimonial.content}"
										</p>
										<div className="flex items-center gap-3">
											<Avatar className="h-10 w-10">
												<AvatarImage src={testimonial.avatar} alt={testimonial.name} />
												<AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-semibold text-sm">{testimonial.name}</p>
												<p className="text-muted-foreground text-xs">
													{testimonial.role} at {testimonial.company}
												</p>
											</div>
										</div>
									</CardContent>
								</CardHeader>
							</Card>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

const Pricing = () => {
	const plans = [
		{
			name: "Starter",
			price: "Free",
			description: "Perfect for individuals and small teams getting started",
			icon: Users,
			features: [
				"Up to 5 workflows",
				"100 executions/month",
				"Basic integrations",
				"Community support",
				"7-day execution history"
			],
			cta: "Start Free",
			popular: false
		},
		{
			name: "Professional",
			price: "$29",
			description: "Advanced features for growing teams and businesses",
			icon: Building2,
			features: [
				"Unlimited workflows",
				"10,000 executions/month",
				"500+ integrations",
				"Priority support",
				"30-day execution history",
				"Advanced analytics",
				"Team collaboration"
			],
			cta: "Start Trial",
			popular: true
		},
		{
			name: "Enterprise",
			price: "Custom",
			description: "Tailored solutions for large organizations",
			icon: Crown,
			features: [
				"Everything in Professional",
				"Unlimited executions",
				"Custom integrations",
				"Dedicated support",
				"Unlimited history",
				"SLA guarantee",
				"Advanced security",
				"White-label options"
			],
			cta: "Contact Sales",
			popular: false
		}
	];

	return (
		<section id="pricing" className="py-20 md:py-32">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<Badge variant="secondary" className="mb-4">
						Pricing
					</Badge>
					<h2 className="mb-6 font-bold text-4xl tracking-tight sm:text-5xl">
						Simple, transparent
						<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							{" "}pricing
						</span>
					</h2>
					<p className="text-muted-foreground text-lg leading-relaxed">
						Choose the plan that fits your needs. Start free and scale as you grow.
					</p>
				</div>

				<div className="mx-auto mt-16 max-w-6xl">
					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						{plans.map((plan, index) => (
							<Card key={index} className={`relative ${plan.popular ? 'border-blue-500 shadow-xl scale-105' : 'border-border'}`}>
								{plan.popular && (
									<div className="absolute -top-4 left-1/2 -translate-x-1/2">
										<Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
											Most Popular
										</Badge>
									</div>
								)}
								<CardHeader className="text-center">
									<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
										<plan.icon className="h-6 w-6 text-blue-600" />
									</div>
									<CardTitle className="text-2xl">{plan.name}</CardTitle>
									<div className="mt-4">
										<span className="font-bold text-4xl">{plan.price}</span>
										{plan.price !== "Free" && plan.price !== "Custom" && (
											<span className="text-muted-foreground">/month</span>
										)}
									</div>
									<p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
								</CardHeader>
								<CardContent>
									<ul className="space-y-3 mb-8">
										{plan.features.map((feature, featureIndex) => (
											<li key={featureIndex} className="flex items-center gap-2">
												<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
												<span className="text-sm">{feature}</span>
											</li>
										))}
									</ul>
									<Button 
										className={`w-full ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' : ''}`}
										variant={plan.popular ? 'default' : 'outline'}
									>
										{plan.cta}
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

const FinalCTA = () => {
	return (
		<section className="py-20 md:py-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="mb-6 font-bold text-5xl text-white tracking-tight sm:text-6xl">
						Ready to transform your workflow?
					</h2>
					<p className="mx-auto mb-12 max-w-2xl text-blue-100 text-xl leading-relaxed">
						Join thousands of teams who have automated their way to success. 
						Start your free trial today and see the difference Pattaka can make.
					</p>
					
					<div className="flex flex-col justify-center gap-4 sm:flex-row">
						<Button
							className="group rounded-xl bg-white px-8 py-4 font-semibold text-lg text-blue-600 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl hover:scale-105"
							size="lg"
						>
							Start Free Trial
							<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
						</Button>
						<Button
							className="rounded-xl border-2 border-white/30 px-8 py-4 font-semibold text-lg text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
							size="lg"
							variant="ghost"
						>
							Schedule Demo
						</Button>
					</div>
					
					<p className="mt-8 text-blue-100 text-sm">
						No credit card required • Free 14-day trial • Cancel anytime
					</p>
				</div>
			</div>
		</section>
	);
};

const Footer = () => {
	return (
		<footer className="border-t bg-background py-12">
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-4">
					<div className="col-span-1 md:col-span-2">
						<div className="flex items-center gap-2 mb-4">
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
								<span className="font-bold text-white text-sm">P</span>
							</div>
							<span className="font-bold text-xl">Pattaka</span>
						</div>
						<p className="text-muted-foreground max-w-md">
							The visual workflow automation platform that helps teams work smarter, 
							not harder. Build, deploy, and scale your automations with ease.
						</p>
					</div>
					
					<div>
						<h4 className="font-semibold mb-4">Product</h4>
						<ul className="space-y-2 text-muted-foreground text-sm">
							<li><a href="#features" className="hover:text-foreground">Features</a></li>
							<li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
							<li><a href="#" className="hover:text-foreground">Integrations</a></li>
							<li><a href="#" className="hover:text-foreground">API</a></li>
						</ul>
					</div>
					
					<div>
						<h4 className="font-semibold mb-4">Company</h4>
						<ul className="space-y-2 text-muted-foreground text-sm">
							<li><a href="#" className="hover:text-foreground">About</a></li>
							<li><a href="#" className="hover:text-foreground">Blog</a></li>
							<li><a href="#" className="hover:text-foreground">Careers</a></li>
							<li><a href="#" className="hover:text-foreground">Contact</a></li>
						</ul>
					</div>
				</div>
				
				<div className="mt-12 border-t pt-8 flex flex-col md:flex-row justify-between items-center">
					<p className="text-muted-foreground text-sm">
						© 2024 Pattaka. All rights reserved.
					</p>
					<div className="flex gap-6 mt-4 md:mt-0">
						<a href="#" className="text-muted-foreground hover:text-foreground text-sm">Privacy</a>
						<a href="#" className="text-muted-foreground hover:text-foreground text-sm">Terms</a>
						<a href="#" className="text-muted-foreground hover:text-foreground text-sm">Security</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

export { Testimonials, Pricing, FinalCTA, Footer }; 