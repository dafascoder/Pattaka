
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Zap, Users } from "lucide-react";

const Hero = () => {
  return (
    <section className="py-16 md:py-24 hero-pattern relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -z-10 top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-br from-primary/30 to-accent/30 blur-[100px] rounded-full opacity-50 animate-pulse-slow"></div>
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
            <Zap className="mr-2 h-4 w-4" />
            Enterprise-Grade AI Agent Builder
          </div>
          
          {/* Main headline */}
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Empower Every Employee to
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Build AI Agents</span>
          </h1>
          
          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600 leading-relaxed">
            Transform repetitive business processes into intelligent automation. No coding required. 
            Enterprise security built-in. Seamless integration with your existing tools.
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
              Start Building Agents
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-2 border-gray-300 px-8 py-4 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
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
        <div className="mt-16 mx-auto max-w-5xl">
          <div className="rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-2 shadow-2xl">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 h-96 flex items-center justify-center">
              <p className="text-white text-xl font-medium">Platform Dashboard Preview</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;