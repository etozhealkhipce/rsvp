import { BookOpen, Library } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/models/auth";

interface HeaderProps {
  user?: User | null;
  subscriptionTier?: "free" | "premium";
}

export function Header({ user, subscriptionTier = "free" }: HeaderProps) {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 mx-auto max-w-6xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block" data-testid="text-logo">
              RSVP Reader
            </span>
          </Link>
          
          {user && (
            <nav className="flex items-center gap-1">
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                size="sm"
                asChild
                data-testid="nav-library"
              >
                <Link href="/">
                  <Library className="h-4 w-4 mr-2" />
                  Library
                </Link>
              </Button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} subscriptionTier={subscriptionTier} />
          ) : (
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign in</a>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
