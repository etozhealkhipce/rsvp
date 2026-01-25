import { BookOpen } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";

import type { AuthUser } from "@shared/types/auth";

interface HeaderProps {
  user?: AuthUser | null;
  subscriptionTier?: "free" | "premium";
}

export function Header({ user, subscriptionTier = "free" }: HeaderProps) {
  // const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container flex h-20 items-center justify-between gap-4 px-6 mx-auto max-w-7xl">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary glow-primary"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <BookOpen className="h-5 w-5 text-white" />
            </motion.div>
            <span
              className="font-bold text-xl hidden sm:inline-block group-hover:gradient-text transition-all"
              data-testid="text-logo"
            >
              RSVP Reader
            </span>
          </Link>

          {/* {user && (
            <nav className="flex items-center gap-2">
              <Button
                variant={location === "/" ? "default" : "ghost"}
                size="sm"
                className={
                  location === "/"
                    ? "gradient-primary border-0 text-white rounded-full px-5"
                    : "rounded-full px-5"
                }
                asChild
                data-testid="nav-library"
              >
                <Link href="/">
                  <Library className="h-4 w-4 mr-2" />
                  Library
                </Link>
              </Button>
            </nav>
          )} */}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} subscriptionTier={subscriptionTier} />
          ) : (
            <Button
              asChild
              className="rounded-full px-6"
              data-testid="button-login"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
