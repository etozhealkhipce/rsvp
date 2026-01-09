import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingElementsLight } from "@/components/floating-elements";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export function LoginPage() {
  const [, navigate] = useLocation();
  const { login, isLoggingIn } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      navigate("/");
    } catch (error: any) {
      const message = error?.message || "Login failed";
      toast({
        title: "Login failed",
        description: message.includes("401")
          ? "Invalid email or password"
          : message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <FloatingElementsLight />
      
      <header className="sticky top-0 z-50 glass">
        <div className="container flex h-20 items-center justify-between px-6 mx-auto max-w-7xl">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary glow-primary"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <BookOpen className="h-5 w-5 text-white" />
            </motion.div>
            <span className="font-bold text-xl">RSVP Reader</span>
          </motion.div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Card className="rounded-3xl border-0 bg-card/80 backdrop-blur shadow-2xl">
            <CardHeader className="text-center pb-2 pt-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="h-16 w-16 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
              <CardDescription className="text-base mt-2">
                Enter your credentials to continue reading
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-10">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="h-12 rounded-xl"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="h-12 rounded-xl pr-12"
                              data-testid="input-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-4 rounded-r-xl"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-full gradient-primary border-0 text-white text-base font-semibold glow-hover"
                    disabled={isLoggingIn}
                    data-testid="button-login"
                  >
                    {isLoggingIn ? "Signing in..." : "Sign in"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Button
                  variant="ghost"
                  className="p-0 h-auto text-primary font-semibold hover:underline hover:bg-transparent"
                  onClick={() => navigate("/register")}
                  data-testid="link-register"
                >
                  Create one
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export function RegisterPage() {
  const [, navigate] = useLocation();
  const { register, isRegistering } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      navigate("/");
    } catch (error: any) {
      const message = error?.message || "Registration failed";
      toast({
        title: "Registration failed",
        description: message.includes("400")
          ? "Email already registered"
          : message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero" />
      <FloatingElementsLight />
      
      <header className="sticky top-0 z-50 glass">
        <div className="container flex h-20 items-center justify-between px-6 mx-auto max-w-7xl">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary glow-primary"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <BookOpen className="h-5 w-5 text-white" />
            </motion.div>
            <span className="font-bold text-xl">RSVP Reader</span>
          </motion.div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Card className="rounded-3xl border-0 bg-card/80 backdrop-blur shadow-2xl">
            <CardHeader className="text-center pb-2 pt-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="h-16 w-16 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              <CardTitle className="text-3xl font-bold">Create an account</CardTitle>
              <CardDescription className="text-base mt-2">
                Start speed reading today
              </CardDescription>
            </CardHeader>
            <CardContent className="px-10 pb-10">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              className="h-12 rounded-xl"
                              data-testid="input-first-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              className="h-12 rounded-xl"
                              data-testid="input-last-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="h-12 rounded-xl"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="At least 6 characters"
                              className="h-12 rounded-xl pr-12"
                              data-testid="input-password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-4 rounded-r-xl"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Repeat password"
                            className="h-12 rounded-xl"
                            data-testid="input-confirm-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-full gradient-primary border-0 text-white text-base font-semibold glow-hover"
                    disabled={isRegistering}
                    data-testid="button-register"
                  >
                    {isRegistering ? "Creating account..." : "Create account"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>

              <div className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Button
                  variant="ghost"
                  className="p-0 h-auto text-primary font-semibold hover:underline hover:bg-transparent"
                  onClick={() => navigate("/login")}
                  data-testid="link-login"
                >
                  Sign in
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
