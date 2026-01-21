import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNextStep } from "nextstepjs";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Settings2,
  ArrowLeft,
  SkipBack,
  SkipForward
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RSVPDisplay } from "@/components/rsvp-display";
import { RSVPSettingsSheet } from "@/components/rsvp-settings";
import { ThemeToggle } from "@/components/theme-toggle";
import { getText, updateProgress, saveText, type StoredText } from "@/lib/indexeddb";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserPreferences, Subscription } from "@shared/schema";
// Redundant navigate import removed

interface RSVPSettings {
  wpm: number;
  fontSize: number;
  gradualStart: boolean;
  pauseOnPunctuation: boolean;
}

export function ReaderPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentTour, currentStep, setCurrentStep } = useNextStep();

  const handleOnboardingClick = (action: 'play-pause' | 'skip-back' | 'skip-forward' | 'reset' | 'settings') => {
    if (currentTour === "onboardingTour" && currentStep !== null) {
      if (action === 'play-pause' && currentStep === 3) setCurrentStep(4);
      if (action === 'skip-back' && currentStep === 4) setCurrentStep(5);
      if (action === 'skip-forward' && currentStep === 5) setCurrentStep(6);
      if (action === 'reset' && currentStep === 6) setCurrentStep(7);
      if (action === 'settings' && currentStep === 7) setCurrentStep(8);
    }
  };
  
  const [text, setText] = useState<StoredText | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [settings, setSettings] = useState<RSVPSettings>({
    wpm: 250,
    fontSize: 64,
    gradualStart: true,
    pauseOnPunctuation: true,
  });
  
  const [currentWpm, setCurrentWpm] = useState(settings.wpm);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const intervalRef = useRef<number | null>(null);
  const rampUpRef = useRef<number | null>(null);
  const settingsInitialized = useRef(false);
  const currentWpmRef = useRef(settings.wpm);

  const { data: preferences } = useQuery<UserPreferences | null>({
    queryKey: ["/api/preferences"],
    queryFn: async () => {
      const response = await fetch("/api/preferences", { credentials: "include" });
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error("Failed to fetch preferences");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: subscription } = useQuery<Subscription | null>({
    queryKey: ["/api/subscription"],
    queryFn: async () => {
      const response = await fetch("/api/subscription", { credentials: "include" });
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error("Failed to fetch subscription");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const response = await apiRequest("PATCH", "/api/preferences", updates);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/preferences"], data);
    },
  });

  const isPremium = subscription?.tier === "premium";
  const maxWpm = subscription?.maxWpm || 350;

  useEffect(() => {
    if (preferences && !settingsInitialized.current) {
      setSettings({
        wpm: preferences.defaultWpm,
        fontSize: preferences.fontSize,
        gradualStart: preferences.gradualStart,
        pauseOnPunctuation: preferences.pauseOnPunctuation,
      });
      setCurrentWpm(preferences.gradualStart ? Math.round(preferences.defaultWpm * 0.6) : preferences.defaultWpm);
      settingsInitialized.current = true;
    }
  }, [preferences]);

  useEffect(() => {
    const loadText = async () => {
      if (!id) {
        setLocation("/");
        return;
      }

      try {
        setIsLoading(true);
        const loadedText = await getText(id);
        
        if (!loadedText) {
          toast({
            title: "Text not found",
            description: "The requested text could not be found.",
            variant: "destructive",
          });
          setLocation("/");
          return;
        }

        setText(loadedText);
        setCurrentIndex(loadedText.currentWordIndex);
        
        if (!settingsInitialized.current) {
          setSettings(prev => ({ ...prev, wpm: loadedText.wpm }));
          setCurrentWpm(settings.gradualStart ? Math.round(loadedText.wpm * 0.6) : loadedText.wpm);
        }
        
        const parsedWords = loadedText.content.split(/\s+/).filter(Boolean);
        setWords(parsedWords);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load the text.",
          variant: "destructive",
        });
        setLocation("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadText();
  }, [id, setLocation, toast]);

  const getDelayForWord = useCallback((word: string, wpm: number) => {
    let baseDelay = 60000 / wpm;
    
    if (settings.pauseOnPunctuation) {
      if (/[.!?]$/.test(word)) {
        baseDelay *= 2.5;
      } else if (/[,;:]$/.test(word)) {
        baseDelay *= 1.5;
      }
    }
    
    if (word.length > 10) {
      baseDelay *= 1.2;
    }
    
    return baseDelay;
  }, [settings.pauseOnPunctuation]);

  useEffect(() => {
    currentWpmRef.current = currentWpm;
  }, [currentWpm]);

  useEffect(() => {
    if (!isPlaying || words.length === 0) {
      return;
    }

    const scheduleNext = () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }

      const delay = getDelayForWord(words[currentIndex], currentWpmRef.current);
      
      intervalRef.current = setTimeout(() => {
        setCurrentIndex(prev => {
          const newIndex = prev + 1;
          if (newIndex >= words.length) {
            setIsPlaying(false);
            toast({
              title: "Finished!",
              description: "You've completed reading this text.",
            });
            return prev;
          }
          if (text) {
            updateProgress(text.id, newIndex);
          }
          return newIndex;
        });
      }, delay) as any;
    };

    scheduleNext();
    
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, words, text, toast, getDelayForWord]);

  useEffect(() => {
    if (isPlaying && settings.gradualStart && startTime) {
      const targetWpm = settings.wpm;
      const startWpm = Math.round(targetWpm * 0.6);
      const rampDuration = 7000;
      
      const updateWpm = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / rampDuration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const newWpm = Math.round(startWpm + (targetWpm - startWpm) * easeProgress);
        
        setCurrentWpm(newWpm);
        
        if (progress < 1) {
          rampUpRef.current = setTimeout(updateWpm, 100) as any;
        }
      };
      
      updateWpm();
      
      return () => {
        if (rampUpRef.current) {
          clearTimeout(rampUpRef.current);
        }
      };
    } else if (isPlaying && !settings.gradualStart) {
      setCurrentWpm(settings.wpm);
    }
  }, [isPlaying, settings.gradualStart, settings.wpm, startTime]);

  const handlePlayPause = () => {
    if (!isPlaying) {
      if (settings.gradualStart) {
        setStartTime(Date.now());
        const startWpm = Math.round(settings.wpm * 0.6);
        setCurrentWpm(startWpm);
        currentWpmRef.current = startWpm;
      } else {
        setCurrentWpm(settings.wpm);
        currentWpmRef.current = settings.wpm;
      }
    } else {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      if (rampUpRef.current) {
        clearTimeout(rampUpRef.current);
      }
    }
    setIsPlaying(!isPlaying);
    handleOnboardingClick('play-pause');
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setStartTime(null);
    const resetWpm = settings.gradualStart ? Math.round(settings.wpm * 0.6) : settings.wpm;
    setCurrentWpm(resetWpm);
    currentWpmRef.current = resetWpm;
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }
    if (rampUpRef.current) {
      clearTimeout(rampUpRef.current);
    }
    if (text) {
      updateProgress(text.id, 0);
    }
    handleOnboardingClick('reset');
  };

  const handleSkipBack = () => {
    const newIndex = Math.max(0, currentIndex - 10);
    setCurrentIndex(newIndex);
    if (text) {
      updateProgress(text.id, newIndex);
    }
    handleOnboardingClick('skip-back');
  };

  const handleSkipForward = () => {
    const newIndex = Math.min(words.length - 1, currentIndex + 10);
    setCurrentIndex(newIndex);
    if (text) {
      updateProgress(text.id, newIndex);
    }
    handleOnboardingClick('skip-forward');
  };

  const handleSettingsChange = async (newSettings: RSVPSettings) => {
    setSettings(newSettings);
    if (!settings.gradualStart || !isPlaying) {
      setCurrentWpm(newSettings.wpm);
      currentWpmRef.current = newSettings.wpm;
    }

    if (text) {
      const updatedText = { ...text, wpm: newSettings.wpm };
      await saveText(updatedText);
      setText(updatedText);
    }

    updatePreferencesMutation.mutate({
      defaultWpm: newSettings.wpm,
      fontSize: newSettings.fontSize,
      gradualStart: newSettings.gradualStart,
      pauseOnPunctuation: newSettings.pauseOnPunctuation,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowLeft":
          handleSkipBack();
          break;
        case "ArrowRight":
          handleSkipForward();
          break;
        case "KeyR":
          handleReset();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlayPause, handleSkipBack, handleSkipForward, handleReset]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!text) {
    return null;
  }

  const progressPercent = words.length > 0 ? (currentIndex / words.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-4 px-4 mx-auto max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="font-medium text-sm truncate max-w-[200px] sm:max-w-none" data-testid="text-reader-title">
            {text.title}
          </h1>
          
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div id="onboarding-settings">
              <RSVPSettingsSheet
                settings={settings}
                onSettingsChange={handleSettingsChange}
                maxWpm={maxWpm}
                isPremium={isPremium}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-4xl">
          <RSVPDisplay 
            word={words[currentIndex] || ""} 
            fontSize={settings.fontSize}
          />
        </div>
      </main>

      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {words.length}
            </span>
            <Badge variant="secondary" className="font-mono" data-testid="badge-wpm">
              {currentWpm} WPM
            </Badge>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercent)}%
            </span>
          </div>
          
          <Progress value={progressPercent} className="h-1.5 mb-4" />
          
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              data-testid="button-reset"
              id="onboarding-reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <div id="onboarding-navigation-controls" className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipBack}
                data-testid="button-skip-back"
                id="onboarding-skip-back"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handlePlayPause}
                className="h-14 w-14 rounded-full gradient-primary border-0 text-white shadow-lg glow-hover transition-all"
                id="onboarding-play-pause"
                size="icon"
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkipForward}
                data-testid="button-skip-forward"
                id="onboarding-skip-forward"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Space</kbd> to play/pause, 
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono mx-1">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">→</kbd> to skip
          </p>
        </div>
      </footer>
    </div>
  );
}
