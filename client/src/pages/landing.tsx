import { useLocation } from "wouter";
import { BookOpen, Zap, Brain, Clock, ArrowRight, Eye, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: Eye,
    title: "Optimal Recognition Point",
    description: "Words are centered at the focal point, keeping your eyes perfectly still while reading.",
  },
  {
    icon: Brain,
    title: "Eliminate Subvocalization",
    description: "Train your brain to process words visually, bypassing the habit of mentally pronouncing each word.",
  },
  {
    icon: Clock,
    title: "Gradual Speed Adaptation",
    description: "Start slow and accelerate gradually, letting your mind adapt naturally to faster reading speeds.",
  },
];

const stats = [
  { value: "3x", label: "Faster Reading" },
  { value: "250+", label: "WPM Average" },
  { value: "100%", label: "Comprehension" },
];

export function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4 px-4 mx-auto max-w-6xl">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">RSVP Reader</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => navigate("/login")} data-testid="button-login-header">
              Sign in
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          <div className="container mx-auto max-w-6xl px-4 relative">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Speed Reading Technology</span>
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                Read Faster.
                <br />
                <span className="text-primary">Comprehend Better.</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Master the art of speed reading with RSVP (Rapid Serial Visual Presentation). 
                Our technology displays words one at a time at your optimal focal point, 
                eliminating eye movement and dramatically increasing reading speed.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button size="lg" onClick={() => navigate("/register")} className="min-w-[200px]" data-testid="button-get-started">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" asChild className="min-w-[200px]" data-testid="button-learn-more">
                  <a href="#features">Learn More</a>
                </Button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-500" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-500" />
                  No credit card required
                </span>
              </div>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How RSVP Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our scientifically-backed approach helps you read faster while maintaining 
                full comprehension of the material.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="hover-elevate">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
              <CardContent className="relative p-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Reading?</h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  Join thousands of readers who have dramatically improved their reading speed. 
                  Start your journey today.
                </p>
                <Button size="lg" onClick={() => navigate("/register")} data-testid="button-start-reading">
                  Start Reading Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm">RSVP Reader</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Speed reading for everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
