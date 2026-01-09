import { FileText, Play, Trash2, Clock } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
}

export function TextCard({ text, onDelete }: TextCardProps) {
  const progressPercent = text.wordCount > 0 
    ? Math.round((text.currentWordIndex / text.wordCount) * 100) 
    : 0;
  
  const estimatedMinutes = Math.ceil((text.wordCount - text.currentWordIndex) / text.wpm);
  const lastRead = formatDistanceToNow(new Date(text.lastReadAt), { addSuffix: true });

  return (
    <Card className="group hover-elevate overflow-visible" data-testid={`card-text-${text.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate mb-1" data-testid="text-title">
              {text.title}
            </h3>
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span>{text.wordCount.toLocaleString()} words</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {estimatedMinutes} min left
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Last read {lastRead}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Button size="sm" className="flex-1" asChild data-testid="button-read">
            <Link href={`/read/${text.id}`}>
              <Play className="h-4 w-4 mr-2" />
              {progressPercent > 0 ? "Continue" : "Start Reading"}
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8" data-testid="button-delete">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Text</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{text.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(text.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
