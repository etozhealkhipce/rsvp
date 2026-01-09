import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, User, Lock, Crown, Zap, Sparkles, Check, X } from "lucide-react";
import { SiTelegram } from "react-icons/si";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { FloatingElementsLight } from "@/components/floating-elements";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subscription } from "@shared/schema";

const emailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required to confirm changes"),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = { currentPassword: string; newPassword: string };

const TELEGRAM_BOT_USERNAME =
  import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "rsvp_app_bot";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function SettingsPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const { data: subscription, isLoading: isLoadingSubscription } =
    useQuery<Subscription>({
      queryKey: ["/api/subscription"],
    });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: "",
      password: "",
    },
  });

  const passwordForm = useForm<PasswordFormData & { confirmPassword: string }>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/subscription/generate-telegram-token",
        {},
      );
      return (await response.json()) as {
        token: string;
        subscription: Subscription;
      };
    },
    onSuccess: (data) => {
      const telegramUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${data.token}`;
      window.open(telegramUrl, "_blank");
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate payment link. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBuyPremium = () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }
    generateTokenMutation.mutate();
  };

  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      setIsUpdatingEmail(true);
      await apiRequest("PATCH", "/api/account/email", data);
      toast({
        title: "Email updated",
        description: "Your email has been changed successfully.",
      });
      emailForm.reset();
    } catch (error: any) {
      toast({
        title: "Failed to update email",
        description: error?.message?.includes("401")
          ? "Invalid password"
          : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const onPasswordSubmit = async (
    data: PasswordFormData & { confirmPassword: string },
  ) => {
    try {
      setIsUpdatingPassword(true);
      await apiRequest("PATCH", "/api/account/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error?.message?.includes("401")
          ? "Current password is incorrect"
          : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 glass">
        <div className="container flex h-20 items-center justify-between gap-4 px-6 mx-auto max-w-4xl">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="font-bold text-xl">Settings</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-3xl px-6 py-10 relative">
        <FloatingElementsLight />
        
        <motion.div 
          className="mb-10 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-bold mb-3">
            Account <span className="gradient-text">Settings</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Manage your account information and security
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 relative z-10"
        >
          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-0 bg-card/50 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Current Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-semibold" data-testid="text-current-email">
                      {user.email}
                    </span>
                  </div>
                  {user.firstName && (
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-semibold">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Tabs defaultValue="subscription" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 rounded-2xl h-14 p-1.5 bg-muted/50">
                <TabsTrigger
                  value="subscription"
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Crown className="h-4 w-4" />
                  <span className="hidden sm:inline">Subscription</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="email" 
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="password" 
                  className="flex items-center gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">Password</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subscription">
                <Card className="rounded-3xl border-0 bg-card/50 backdrop-blur overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle className="flex items-center gap-3 text-xl">
                          Subscription
                          {subscription?.tier === "premium" ? (
                            <Badge className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white border-0 px-3 py-1">
                              <Crown className="h-3.5 w-3.5 mr-1" />
                              Premium
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="px-3 py-1">Free</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {subscription?.tier === "premium"
                            ? `Max speed: ${subscription.maxWpm} WPM`
                            : "Upgrade to unlock faster reading speeds"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {isLoadingSubscription ? (
                      <div className="text-muted-foreground">Loading...</div>
                    ) : subscription?.tier === "premium" ? (
                      <motion.div 
                        className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-pink-500/10 border border-amber-500/20"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <motion.div
                            className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Crown className="h-6 w-6 text-white" />
                          </motion.div>
                          <span className="font-bold text-xl">Premium Active</span>
                        </div>
                        <p className="text-muted-foreground">
                          You have access to reading speeds up to{" "}
                          <span className="font-semibold text-foreground">{subscription.maxWpm} WPM</span> and all premium features.
                        </p>
                        {subscription.paidAt && (
                          <p className="text-sm text-muted-foreground mt-3">
                            Activated: {new Date(subscription.paidAt).toLocaleDateString()}
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="p-6 rounded-2xl border bg-card/50">
                            <h4 className="font-bold text-lg mb-4">Free</h4>
                            <ul className="space-y-3 text-sm">
                              <li className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                                Up to 350 WPM
                              </li>
                              <li className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                                Basic RSVP features
                              </li>
                              <li className="flex items-center gap-3 text-muted-foreground">
                                <div className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center">
                                  <X className="h-3.5 w-3.5" />
                                </div>
                                Advanced settings
                              </li>
                            </ul>
                          </div>
                          <div className="p-6 rounded-2xl gradient-border relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-pink-500/5" />
                            <div className="relative">
                              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                Premium 
                                <Sparkles className="h-5 w-5 text-amber-500" />
                              </h4>
                              <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-3">
                                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  Up to 1000 WPM
                                </li>
                                <li className="flex items-center gap-3">
                                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  All features unlocked
                                </li>
                                <li className="flex items-center gap-3">
                                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center">
                                    <Check className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  Priority support
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Button
                            onClick={handleBuyPremium}
                            disabled={generateTokenMutation.isPending}
                            className="h-14 px-8 rounded-full text-lg bg-[#0088cc] hover:bg-[#0077b5] glow-hover"
                            data-testid="button-buy-premium"
                          >
                            <SiTelegram className="h-6 w-6 mr-3" />
                            {generateTokenMutation.isPending
                              ? "Opening Telegram..."
                              : "Buy Premium via Telegram"}
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            Pay with Telegram Stars - fast and secure payment through Telegram
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <Card className="rounded-3xl border-0 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Change Email</CardTitle>
                    <CardDescription>Update your email address</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...emailForm}>
                      <form
                        onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                        className="space-y-5"
                      >
                        <FormField
                          control={emailForm.control}
                          name="newEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="new@example.com"
                                  className="h-12 rounded-xl"
                                  data-testid="input-new-email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={emailForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm with Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Enter your password"
                                  className="h-12 rounded-xl"
                                  data-testid="input-confirm-password-email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={isUpdatingEmail}
                          className="rounded-full h-12 px-8"
                          data-testid="button-update-email"
                        >
                          {isUpdatingEmail ? "Updating..." : "Update Email"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="password">
                <Card className="rounded-3xl border-0 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form
                        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                        className="space-y-5"
                      >
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type={showPasswords ? "text" : "password"}
                                    placeholder="Enter current password"
                                    className="h-12 rounded-xl pr-12"
                                    data-testid="input-current-password"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-4 rounded-r-xl"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                  >
                                    {showPasswords ? (
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
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input
                                  type={showPasswords ? "text" : "password"}
                                  placeholder="At least 6 characters"
                                  className="h-12 rounded-xl"
                                  data-testid="input-new-password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input
                                  type={showPasswords ? "text" : "password"}
                                  placeholder="Repeat new password"
                                  className="h-12 rounded-xl"
                                  data-testid="input-confirm-new-password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={isUpdatingPassword}
                          className="rounded-full h-12 px-8"
                          data-testid="button-update-password"
                        >
                          {isUpdatingPassword ? "Updating..." : "Update Password"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
