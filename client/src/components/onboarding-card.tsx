import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import type { CardComponentProps } from "nextstepjs";

export function OnboardingCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
}: CardComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="bg-background dark:glass p-7 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] max-w-[22rem] min-w-[22rem] border border-border/50 dark:border-0 relative overflow-hidden"
    >
      {/* Background glow decorator */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {step.icon && (
              <div className="h-11 w-11 rounded-2xl gradient-primary flex items-center justify-center text-xl shadow-lg glow-primary flex-shrink-0">
                {step.icon}
              </div>
            )}
            <h3 className="text-xl font-extrabold gradient-text tracking-tight leading-tight">{step.title}</h3>
          </div>
          {step.showSkip && (
            <Button
              variant="ghost"
              size="icon"
              onClick={skipTour}
              className="rounded-full h-8 w-8 -mt-1 -mr-1 hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="text-muted-foreground leading-relaxed mb-8 text-[0.95rem]">
          {step.content}
        </div>

        <div className="flex items-center justify-between mt-auto pt-5 border-t border-border/30">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-5 bg-primary" : "w-1 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {!((step as any).hideNext) && (
            <Button
              size="sm"
              onClick={nextStep}
              className="rounded-full px-5 h-10 gradient-primary border-0 text-white font-bold shadow-lg glow-hover transition-all hover:scale-105 active:scale-95"
            >
              {currentStep === totalSteps - 1 ? "Get Started" : "Next"}
              {currentStep < totalSteps - 1 && <ChevronRight className="h-4 w-4 ml-1.5" />}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
