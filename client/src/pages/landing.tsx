import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Zap, Brain, Clock, ArrowRight, Eye, Target, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingElements } from "@/components/floating-elements";

const features = [
  {
    icon: Eye,
    title: "Optimal Recognition Point",
    description: "Words are centered at the focal point, keeping your eyes perfectly still while reading.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Eliminate Subvocalization",
    description: "Train your brain to process words visually, bypassing the habit of mentally pronouncing each word.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Clock,
    title: "Gradual Speed Adaptation",
    description: "Start slow and accelerate gradually, letting your mind adapt naturally to faster reading speeds.",
    color: "from-orange-500 to-red-500",
  },
];

const stats = [
  { value: "3x", label: "Faster Reading", icon: Zap },
  { value: "350+", label: "WPM Speed", icon: Target },
  { value: "100%", label: "Comprehension", icon: Brain },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
};

export function LandingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container flex h-20 items-center justify-between gap-4 px-6 mx-auto max-w-7xl">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary glow-primary"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <BookOpen className="h-5 w-5 text-white" />
            </motion.div>
            <span className="font-bold text-xl hidden md:block">RSVP Reader</span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ThemeToggle />
            <Button 
              onClick={() => navigate("/login")} 
              variant="outline"
              className="rounded-full px-6"
              data-testid="button-login-header"
            >
              Sign in
            </Button>
            <Button 
              onClick={() => navigate("/register")} 
              className="rounded-full px-6 gradient-primary border-0 text-white"
              data-testid="button-signup-header"
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </header>

      <main>
        <section className="relative min-h-screen flex items-center justify-center pt-20">
          <div className="absolute inset-0 gradient-hero" />
          <FloatingElements />
          
          <div className="container mx-auto max-w-7xl px-6 relative z-10">
            <motion.div 
              className="mx-auto max-w-4xl text-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="my-8 inline-flex items-center gap-2 rounded-full glass px-5 py-2.5"
                variants={itemVariants}
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Speed Reading Technology</span>
              </motion.div>
              
              <motion.h1 
                className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8"
                variants={itemVariants}
              >
                Read Faster.
                <br />
                <span className="gradient-text">Comprehend Better.</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
                variants={itemVariants}
              >
                Master the art of speed reading with RSVP. Our technology displays words 
                one at a time at your optimal focal point, eliminating eye movement and 
                dramatically increasing reading speed.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
                variants={itemVariants}
              >
                <Button 
                  size="lg" 
                  onClick={() => navigate("/register")} 
                  className="min-w-[220px] h-14 text-lg rounded-full gradient-primary border-0 text-white glow-hover"
                  data-testid="button-get-started"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="min-w-[220px] h-14 text-lg rounded-full"
                  data-testid="button-learn-more"
                  asChild
                >
                  <a href="#features">Learn More</a>
                </Button>
              </motion.div>

              <motion.div 
                className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
                variants={itemVariants}
              >
                <span className="flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-full">
                  <Target className="h-4 w-4" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full">
                  <Sparkles className="h-4 w-4" />
                  No credit card required
                </span>
              </motion.div>
            </motion.div>

            <motion.div 
              className="my-20 grid grid-cols-3 gap-6 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={stat.label} 
                  className="text-center glass rounded-3xl p-6"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <stat.icon className="h-6 w-6 text-primary mx-auto mb-3" />
                  <div className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ 
              opacity: { delay: 1.5 },
              y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
            }}
          >
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown className="h-8 w-8" />
            </a>
          </motion.div>
        </section>

        <section id="features" className="py-32 relative">
          <div className="absolute inset-0 bg-muted/30" />
          <div className="container mx-auto max-w-7xl px-6 relative">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                How <span className="gradient-text">RSVP</span> Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our scientifically-backed approach helps you read faster while maintaining 
                full comprehension of the material.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                >
                  <Card className="h-full card-lift border-0 bg-card/50 backdrop-blur">
                    <CardContent className="p-8">
                      <motion.div 
                        className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <feature.icon className="h-8 w-8 text-white" />
                      </motion.div>
                      <h3 className="font-bold text-xl mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-32 relative overflow-hidden">
          <FloatingElements />
          <div className="container mx-auto max-w-7xl px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="relative overflow-hidden border-0 gradient-border">
                <div className="absolute inset-0 gradient-hero" />
                <CardContent className="relative p-16 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                  >
                    <Sparkles className="h-12 w-12 text-primary mx-auto mb-6" />
                    <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                      Ready to Transform Your Reading?
                    </h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
                      Join thousands of readers who have dramatically improved their reading speed. 
                      Start your journey today.
                    </p>
                    <Button 
                      size="lg" 
                      onClick={() => navigate("/register")} 
                      className="h-14 px-10 text-lg rounded-full gradient-primary border-0 text-white glow-hover"
                      data-testid="button-start-reading"
                    >
                      Start Reading Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">RSVP Reader</span>
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
