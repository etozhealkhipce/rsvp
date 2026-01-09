import { useState, useEffect } from "react";
import { Plus, BookOpen, Search, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { FileUpload } from "@/components/file-upload";
import { TextCard } from "@/components/text-card";
import { SubscriptionBadge } from "@/components/subscription-badge";
import { getAllTexts, deleteText, type StoredText } from "@/lib/indexeddb";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/models/auth";

interface DashboardProps {
  user: User;
  subscriptionTier?: "free" | "premium";
}

export function Dashboard({ user, subscriptionTier = "free" }: DashboardProps) {
  const [texts, setTexts] = useState<StoredText[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTexts();
  }, []);

  const loadTexts = async () => {
    try {
      setIsLoading(true);
      const allTexts = await getAllTexts();
      setTexts(allTexts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your texts.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteText = async (id: string) => {
    try {
      await deleteText(id);
      setTexts(texts.filter(t => t.id !== id));
      toast({
        title: "Deleted",
        description: "Text has been removed from your library.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete text.",
        variant: "destructive",
      });
    }
  };

  const handleTextAdded = (newText: StoredText) => {
    setTexts([newText, ...texts]);
  };

  const filteredTexts = texts.filter(text =>
    text.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "there";

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} subscriptionTier={subscriptionTier} />
      
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {displayName}
          </h1>
          <p className="text-muted-foreground">
            Continue reading or add new texts to your library.
          </p>
        </div>

        {subscriptionTier === "free" && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Upgrade to Premium</h3>
                    <SubscriptionBadge tier="premium" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Unlock unlimited reading speed, advanced settings, and more features.
                  </p>
                </div>
                <Button variant="default" data-testid="button-upgrade">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search your library..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Button onClick={() => setUploadDialogOpen(true)} data-testid="button-add-text">
            <Plus className="h-4 w-4 mr-2" />
            Add Text
          </Button>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-2 bg-muted rounded w-full mt-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTexts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTexts.map((text) => (
              <TextCard
                key={text.id}
                text={text}
                onDelete={handleDeleteText}
              />
            ))}
          </div>
        ) : texts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Library className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Your library is empty</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Add your first text to start speed reading. Paste text or upload a .txt file.
              </p>
              <Button onClick={() => setUploadDialogOpen(true)} data-testid="button-add-first-text">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Text
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground text-sm">
                No texts match your search. Try a different query.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <FileUpload
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onTextAdded={handleTextAdded}
      />
    </div>
  );
}
