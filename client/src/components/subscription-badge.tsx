import { Crown, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface SubscriptionBadgeProps {
  tier: "free" | "premium";
  className?: string;
}

export function SubscriptionBadge({ tier, className }: SubscriptionBadgeProps) {
  if (tier === "premium") {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <Badge 
          className={`bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white border-0 gap-1.5 px-3 py-1 shadow-lg shadow-amber-500/25 ${className}`}
          data-testid="badge-subscription-premium"
        >
          <Crown className="h-3.5 w-3.5" />
          Premium
        </Badge>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
    >
      <Badge 
        variant="secondary" 
        className={`gap-1.5 px-3 py-1 ${className}`}
        data-testid="badge-subscription-free"
      >
        <Zap className="h-3.5 w-3.5" />
        Free
      </Badge>
    </motion.div>
  );
}
