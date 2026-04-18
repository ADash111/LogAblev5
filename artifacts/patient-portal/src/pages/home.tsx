import { Link } from "wouter";
import { Activity, Shield, Clock, HeartPulse, UserCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-6 w-6" />
            <span className="font-semibold text-lg tracking-tight">LogAble</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="hidden sm:inline-flex rounded-full">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight leading-tight">
                Clinical-grade care, <br />
                <span className="text-primary">connected.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                A secure communication portal bridging the gap between patients and doctors. 
                Manage appointments, track vitals, and coordinate care with medical precision.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full sm:w-auto rounded-full group">
                    Create Patient Account
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5">
                    Doctor Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-secondary/50 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need for better care</h2>
              <p className="text-muted-foreground text-lg">A unified dashboard designed for both patients and healthcare providers.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: "Secure Messaging",
                  description: "HIPAA-compliant direct communication with your healthcare team."
                },
                {
                  icon: Clock,
                  title: "Smart Scheduling",
                  description: "Request and manage appointments with real-time calendar availability."
                },
                {
                  icon: HeartPulse,
                  title: "Vitals Tracking",
                  description: "Log and monitor critical health metrics with automatic alerts."
                }
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl bg-card border border-card-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="font-semibold">LogAble</span>
          </div>
          <p>© {new Date().getFullYear()} LogAble. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
