import { Link } from "wouter";
import { Activity, Shield, Clock, HeartPulse, ArrowRight, Stethoscope, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-primary/95 backdrop-blur supports-[backdrop-filter]:bg-primary/90">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Activity className="h-6 w-6" />
            <span className="font-semibold text-lg tracking-tight">LogAble</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="hidden sm:inline-flex rounded-full bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,48%)] border-0 text-white shadow-sm">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 overflow-hidden relative bg-gradient-to-br from-primary via-[hsl(185,55%,25%)] to-[hsl(195,60%,18%)]">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, hsl(15,80%,60%) 0%, transparent 60%)" }} />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-medium mb-2">
                <Stethoscope className="h-4 w-4" />
                Clinical-Grade Patient Portal
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                Healthcare,{" "}
                <span className="text-[hsl(15,80%,70%)]">connected.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed">
                A secure communication portal bridging the gap between patients and doctors.
                Manage appointments, track vitals, and coordinate care with medical precision.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/sign-up">
                  <Button size="lg" className="w-full sm:w-auto rounded-full group bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,48%)] border-0 text-white shadow-lg px-8">
                    Create Patient Account
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white px-8">
                    Doctor Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12">
              <path d="M0 60L1440 60L1440 20C1200 60 900 0 720 20C540 40 240 0 0 20L0 60Z" fill="hsl(210,20%,98%)" />
            </svg>
          </div>
        </section>

        {/* Stats strip */}
        <section className="py-10 border-b border-border/40 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-12 text-center">
              {[
                { value: "100%", label: "HIPAA Compliant" },
                { value: "4", label: "Vital Metrics Tracked" },
                { value: "Real-time", label: "Doctor Alerts" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-bold text-primary">{value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-background to-[hsl(185,40%,96%)]">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-foreground">Everything you need for better care</h2>
              <p className="text-muted-foreground text-lg">A unified dashboard designed for both patients and healthcare providers.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: "Secure Messaging",
                  description: "HIPAA-compliant direct communication with your healthcare team.",
                  accent: "teal",
                },
                {
                  icon: Clock,
                  title: "Smart Scheduling",
                  description: "Request and manage appointments with real-time calendar availability.",
                  accent: "orange",
                },
                {
                  icon: HeartPulse,
                  title: "Vitals Tracking",
                  description: "Log and monitor critical health metrics with automatic abnormal and critical alerts.",
                  accent: "teal",
                }
              ].map((feature, i) => (
                <div
                  key={i}
                  className={`p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${
                    feature.accent === "orange"
                      ? "border-[hsl(15,80%,60%)]/20 hover:border-[hsl(15,80%,60%)]/40"
                      : "border-primary/20 hover:border-primary/40"
                  }`}
                >
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 ${
                    feature.accent === "orange"
                      ? "bg-[hsl(15,80%,60%)]/10"
                      : "bg-primary/10"
                  }`}>
                    <feature.icon className={`h-6 w-6 ${
                      feature.accent === "orange" ? "text-[hsl(15,80%,55%)]" : "text-primary"
                    }`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vitals highlight section */}
        <section className="py-20 bg-gradient-to-br from-primary/8 via-[hsl(185,50%,94%)] to-background border-t border-primary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
                  <Activity className="h-4 w-4" />
                  Smart Vital Interpretation
                </div>
                <h2 className="text-3xl font-bold text-foreground leading-tight">
                  Automatic alerts for abnormal &amp; critical readings
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  LogAble automatically classifies each vital log as normal, abnormal, or critical — giving doctors instant visibility into patients who need attention.
                </p>
                <div className="space-y-3">
                  {[
                    { label: "Heart Rate", range: "60–100 bpm" },
                    { label: "Respiration", range: "12–20 br/min" },
                    { label: "SpO₂", range: "95–100%" },
                    { label: "Blood Pressure", range: "90/60–120/80 mmHg" },
                  ].map(({ label, range }) => (
                    <div key={label} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{label}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{range} normal</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-green-700">Normal</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <span className="text-green-800 font-medium">HR: 72</span>
                    <span className="text-green-800 font-medium">SpO₂: 98%</span>
                    <span className="text-green-800 font-medium">BP: 115/75</span>
                    <span className="text-green-800 font-medium">Resp: 16</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Abnormal</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <span className="text-amber-800 font-medium">HR: 108</span>
                    <span className="text-amber-800 font-medium">SpO₂: 93%</span>
                    <span className="text-amber-800 font-medium">BP: 135/85</span>
                    <span className="text-amber-800 font-medium">Resp: 22</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-red-700">Critical</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <span className="text-red-800 font-medium">HR: 145</span>
                    <span className="text-red-800 font-medium">SpO₂: 87%</span>
                    <span className="text-red-800 font-medium">BP: 185/125</span>
                    <span className="text-red-800 font-medium">Resp: 32</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-[hsl(15,80%,55%)] via-[hsl(25,75%,52%)] to-[hsl(15,80%,55%)]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">Join LogAble today and experience smarter, connected healthcare.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="rounded-full bg-white text-[hsl(15,80%,50%)] hover:bg-white/90 border-0 px-10 font-semibold shadow-lg">
                  Create Free Account
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="rounded-full border-white/40 text-white hover:bg-white/10 hover:text-white px-10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 bg-background">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="h-4 w-4" />
            <span className="font-semibold">LogAble</span>
          </div>
          <p>© {new Date().getFullYear()} LogAble. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
