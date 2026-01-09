import { Crown, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SubscriptionBadgeProps {
  tier: "free" | "premium";
  className?: string;
}

export function SubscriptionBadge({ tier, className }: SubscriptionBadgeProps) {
  if (tier === "premium") {
    return (
      <Badge 
        className={`bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1 ${className}`}
        data-testid="badge-subscription-premium"
      >
        <Crown className="h-3 w-3" />
        Premium
      </Badge>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className={`gap-1 ${className}`}
      data-testid="badge-subscription-free"
    >
      <Zap className="h-3 w-3" />
      Free
    </Badge>
  );
}
