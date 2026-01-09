import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { LandingPage } from "@/pages/landing";
import { Dashboard } from "@/pages/dashboard";
import { ReaderPage } from "@/pages/reader";
import NotFound from "@/pages/not-found";
import type { Subscription } from "@shared/schema";

function useSubscription(isAuthenticated: boolean) {
  return useQuery<Subscription | null>({
    queryKey: ["/api/subscription"],
    queryFn: async () => {
      const response = await fetch("/api/subscription", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error("Failed to fetch subscription");
      }
      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const { data: subscription } = useSubscription(!!user);
  
  const subscriptionTier = (subscription?.tier as "free" | "premium") || "free";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {user ? <Dashboard user={user} subscriptionTier={subscriptionTier} /> : <LandingPage />}
      </Route>
      <Route path="/read/:id">
        {user ? <ReaderPage /> : <LandingPage />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="rsvp-reader-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
