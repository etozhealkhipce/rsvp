import { FileText, Play, Trash2, Clock, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useNextStep } from "nextstepjs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import type { StoredText } from "@/lib/indexeddb";

interface TextCardProps {
  text: StoredText;
  onDelete: (id: string) => void;
  isFirstCard?: boolean;
}

export function TextCard({ text, onDelete, isFirstCard = false }: TextCardProps) {
  const { currentTour, currentStep, setCurrentStep } = useNextStep();
  const progressPercent = text.wordCount > 0 
    ? Math.round((text.currentWordIndex / text.wordCount) * 100) 
    : 0;
  
  const estimatedMinutes = Math.ceil((text.wordCount - text.currentWordIndex) / text.wpm);
  const lastRead = formatDistanceToNow(new Date(text.lastReadAt), { addSuffix: true });

  const gradientColors = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-orange-500 to-red-500",
    "from-green-500 to-teal-500",
    "from-indigo-500 to-purple-500",
  ];
  
  const colorIndex = text.id.charCodeAt(0) % gradientColors.length;
  const gradient = gradientColors[colorIndex];

  return (
    <Card 
      className="group card-lift rounded-3xl border-0 bg-card/50 backdrop-blur overflow-visible" 
      data-testid={`card-text-${text.id}`}
      id={isFirstCard ? "onboarding-sample-book" : undefined}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <motion.div 
            className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <BookOpen className="h-7 w-7 text-white" />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate mb-2" data-testid="text-title">
              {text.title}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {text.wordCount.toLocaleString()} words
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {estimatedMinutes} min left
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold gradient-text">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Last read {lastRead}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border/50">
          <Button 
            className="flex-1 rounded-full h-11 gradient-primary border-0 text-white" 
            asChild 
            data-testid="button-read"
            id={isFirstCard ? "onboarding-start-reading" : undefined}
          >
            <Link 
              href={`/read/${text.id}`}
              onClick={() => {
                if (isFirstCard && currentTour === "onboardingTour" && currentStep === 2) {
                  // Small delay to allow Reader page to mount before advancing tour step
                  setTimeout(() => {
                    setCurrentStep(3);
                  }, 100);
                }
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              {progressPercent > 0 ? "Continue" : "Start Reading"}
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-11 w-11 rounded-full hover:bg-destructive/10 hover:text-destructive" 
                data-testid="button-delete"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Text</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{text.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full" data-testid="button-cancel-delete">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(text.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
                  data-testid="button-confirm-delete"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
