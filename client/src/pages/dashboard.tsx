import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Library, Sparkles, Zap, ArrowRight } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useNextStep } from "nextstepjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { TextCard } from "@/components/text-card";
import { FloatingElementsLight } from "@/components/floating-elements";
import {
  getAllTexts,
  deleteText,
  saveText,
  generateId,
  type StoredText,
} from "@/lib/indexeddb";
import { useToast } from "@/hooks/use-toast";

import type { AuthUser } from "@shared/types/auth";
import { AddTextModal } from "@/features/add-text";

interface DashboardProps {
  user: AuthUser;
  subscriptionTier?: "free" | "premium";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function Dashboard({ user, subscriptionTier = "free" }: DashboardProps) {
  const [texts, setTexts] = useState<StoredText[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { startNextStep } = useNextStep();
  const onboardingStarted = useRef(false);

  useEffect(() => {
    loadTexts();
  }, []);

  // Handle onboarding flow
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const shouldOnboard = params.get("onboarding") === "true";

    if (shouldOnboard && !onboardingStarted.current && !isLoading) {
      onboardingStarted.current = true;

      // Clear the URL param
      window.history.replaceState({}, "", "/");

      // Fetch and add default book, then start tour
      const setupOnboarding = async () => {
        try {
          const response = await fetch("/api/default-books");
          if (response.ok) {
            const defaultBooks = await response.json();
            if (defaultBooks.length > 0) {
              const book = defaultBooks[0];
              // Check if book already exists in IndexedDB
              const existingTexts = await getAllTexts();
              const alreadyExists = existingTexts.some(
                (t) => t.title === book.title,
              );

              if (!alreadyExists) {
                const newText: StoredText = {
                  id: generateId(),
                  title: book.title,
                  content: book.content,
                  wordCount: book.wordCount,
                  currentWordIndex: 0,
                  wpm: 250,
                  lastReadAt: new Date(),
                  createdAt: new Date(),
                  fileType: "text",
                };
                await saveText(newText);
                setTexts((prev) => [newText, ...prev]);
              }
            }
          }
        } catch (error) {
          console.error("Error setting up onboarding:", error);
        }

        // Start the tour after a short delay to let UI render
        setTimeout(() => {
          startNextStep("onboardingTour");
        }, 500);
      };

      setupOnboarding();
    }
  }, [searchString, isLoading, startNextStep]);

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
      setTexts(texts.filter((t) => t.id !== id));
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

  const handleTextAdded = async (newText: StoredText) => {
    setTexts((prev) => [newText, ...prev]);

    try {
      const allTexts = await getAllTexts();
      setTexts(allTexts);
    } catch (error) {
      console.error("Failed to refresh texts after adding:", error);
    }
  };

  const filteredTexts = texts.filter((text) =>
    text.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || "there";

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} subscriptionTier={subscriptionTier} />

      <main className="container mx-auto max-w-7xl px-6 py-10">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-3">
            Welcome back, <span className="gradient-text">{displayName}</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Continue reading or add new texts to your library.
          </p>
        </motion.div>

        {subscriptionTier === "free" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="mb-10 overflow-hidden border-0 gradient-border">
              <div className="absolute inset-0 gradient-hero" />
              <CardContent className="relative p-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <motion.div
                      className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Sparkles className="h-7 w-7 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-xl mb-2">
                        Unlock Premium Features
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        Read up to 1000 WPM, get advanced settings, and enjoy
                        unlimited reading.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate("/settings")}
                    className="rounded-full px-8 h-12 gradient-primary border-0 text-white glow-hover"
                    data-testid="button-upgrade"
                  >
                    Upgrade to Premium
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search your library..."
              className="pl-12 h-12 rounded-2xl text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="rounded-full px-6 h-12 gradient-primary border-0 text-white"
            data-testid="button-add-text"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Text
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-muted" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-muted rounded-full w-3/4" />
                      <div className="h-4 bg-muted rounded-full w-1/2" />
                      <div className="h-2 bg-muted rounded-full w-full mt-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTexts.length > 0 ? (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredTexts.map((text, index) => (
              <motion.div key={text.id} variants={itemVariants}>
                <TextCard
                  text={text}
                  onDelete={handleDeleteText}
                  isFirstCard={index === 0}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : texts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-dashed border-2 rounded-3xl overflow-hidden relative">
              <FloatingElementsLight />
              <CardContent className="py-20 text-center relative z-10">
                <motion.div
                  className="h-20 w-20 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Library className="h-10 w-10 text-white" />
                </motion.div>
                <h3 className="font-bold text-2xl mb-3">
                  Your library is empty
                </h3>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-lg">
                  Add your first text to start speed reading. Paste text or
                  upload a .txt file.
                </p>
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="rounded-full px-8 h-12 gradient-primary border-0 text-white glow-hover"
                  data-testid="button-add-first-text"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Your First Text
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-dashed border-2 rounded-3xl">
              <CardContent className="py-16 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  No texts match your search. Try a different query.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      <AddTextModal
        open={uploadDialogOpen}
        onTextAdded={handleTextAdded}
        handleClose={() => setUploadDialogOpen(false)}
      />
    </div>
  );
}
