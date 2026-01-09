import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, User, Lock, Crown, Zap } from "lucide-react";
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
  import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "default";

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
      console.log(TELEGRAM_BOT_USERNAME);
      console.log(data);
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
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4 px-4 mx-auto max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="font-semibold">Settings</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Account Settings</h2>
          <p className="text-muted-foreground">
            Manage your account information and security
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Current Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium" data-testid="text-current-email">
                  {user.email}
                </span>
              </div>
              {user.firstName && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="subscription"
              className="flex items-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Subscription
                      {subscription?.tier === "premium" ? (
                        <Badge className="bg-amber-500 text-white">
                          Premium
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Free</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
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
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-amber-500" />
                        <span className="font-medium">Premium Active</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You have access to reading speeds up to{" "}
                        {subscription.maxWpm} WPM and all premium features.
                      </p>
                      {subscription.paidAt && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Activated:{" "}
                          {new Date(subscription.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 rounded-lg border">
                        <h4 className="font-medium mb-2">Free</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <Zap className="h-3 w-3" /> Up to 350 WPM
                          </li>
                          <li className="flex items-center gap-2">
                            <Zap className="h-3 w-3" /> Basic RSVP features
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-500/5">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          Premium <Crown className="h-4 w-4 text-amber-500" />
                        </h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-amber-500" /> Up to
                            1000 WPM
                          </li>
                          <li className="flex items-center gap-2">
                            <Zap className="h-3 w-3 text-amber-500" /> All
                            features unlocked
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Button
                        onClick={handleBuyPremium}
                        disabled={generateTokenMutation.isPending}
                        className="flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b5]"
                        data-testid="button-buy-premium"
                      >
                        <SiTelegram className="h-5 w-5" />
                        {generateTokenMutation.isPending
                          ? "Opening Telegram..."
                          : "Buy Premium via Telegram"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Pay with Telegram Stars - fast and secure payment
                        through Telegram
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Change Email</CardTitle>
                <CardDescription>Update your email address</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...emailForm}>
                  <form
                    onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                    className="space-y-4"
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
                              placeholder="••••••••"
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
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-4"
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
                                placeholder="••••••••"
                                data-testid="input-current-password"
                                {...field}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
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
                              placeholder="••••••••"
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
      </main>
    </div>
  );
}
