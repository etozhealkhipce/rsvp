import { LogOut, Settings } from "lucide-react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SubscriptionBadge } from "./subscription-badge";
import { useAuth } from "@/hooks/use-auth";

import type { AuthUser } from "@shared/types/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from "./ui/drawer";

interface UserMenuProps {
  user: AuthUser;
  subscriptionTier?: "free" | "premium";
}

export function UserMenu({ user, subscriptionTier = "free" }: UserMenuProps) {
  const [, navigate] = useLocation();
  const { logout, isLoggingOut } = useAuth();
  const isMobile = useIsMobile();

  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "U";
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "User";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-9 w-9 rounded-full"
            data-testid="button-user-menu"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={user.profileImageUrl || undefined}
                alt={displayName}
              />
              <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DrawerTrigger>

        <DrawerContent>
          <DrawerHeader className="font-normal">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-center gap-10">
                <p
                  className="text-sm font-medium leading-none"
                  data-testid="text-user-name"
                >
                  {displayName}
                </p>
                <SubscriptionBadge tier={subscriptionTier} />
              </div>
              {user.email && (
                <p
                  className="text-xs leading-none text-muted-foreground"
                  data-testid="text-user-email"
                >
                  {user.email}
                </p>
              )}
            </div>
          </DrawerHeader>

          <hr />

          <DrawerFooter>
            <Button
              variant="ghost"
              onClick={() => {
                navigate("/settings");
              }}
              className="cursor-pointer"
              data-testid="link-settings"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="cursor-pointer text-destructive focus:text-destructive"
              disabled={isLoggingOut}
              data-testid="link-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full"
          data-testid="button-user-menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user.profileImageUrl || undefined}
              alt={displayName}
            />
            <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <p
                className="text-sm font-medium leading-none"
                data-testid="text-user-name"
              >
                {displayName}
              </p>
              <SubscriptionBadge tier={subscriptionTier} />
            </div>
            {user.email && (
              <p
                className="text-xs leading-none text-muted-foreground"
                data-testid="text-user-email"
              >
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/settings")}
          className="cursor-pointer"
          data-testid="link-settings"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
          disabled={isLoggingOut}
          data-testid="link-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
