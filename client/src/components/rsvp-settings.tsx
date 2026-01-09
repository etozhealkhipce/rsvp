import { Settings, Gauge, Type, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface RSVPSettings {
  wpm: number;
  fontSize: number;
  gradualStart: boolean;
  pauseOnPunctuation: boolean;
}

interface RSVPSettingsProps {
  settings: RSVPSettings;
  onSettingsChange: (settings: RSVPSettings) => void;
  maxWpm?: number;
  isPremium?: boolean;
}

export function RSVPSettingsSheet({ 
  settings, 
  onSettingsChange, 
  maxWpm = 350,
  isPremium = false 
}: RSVPSettingsProps) {
  const updateSetting = <K extends keyof RSVPSettings>(key: K, value: RSVPSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-settings">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Reading Settings</SheetTitle>
          <SheetDescription>
            Customize your reading experience.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 mt-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Reading Speed</Label>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {settings.wpm} WPM
                </span>
                {!isPremium && settings.wpm >= maxWpm && (
                  <span className="text-xs text-amber-500">Free tier limit</span>
                )}
              </div>
              <Slider
                value={[settings.wpm]}
                onValueChange={([value]) => updateSetting("wpm", value)}
                min={100}
                max={isPremium ? 1000 : maxWpm}
                step={10}
                data-testid="slider-wpm"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>100</span>
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
                <span>{isPremium ? 1000 : maxWpm}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Font Size</Label>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {settings.fontSize}px
                </span>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSetting("fontSize", value)}
                min={32}
                max={128}
                step={4}
                data-testid="slider-font-size"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Advanced Options</Label>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="gradual-start" className="text-sm">Gradual Start</Label>
                  <p className="text-xs text-muted-foreground">
                    Begin at 60% speed, gradually reaching full speed
                  </p>
                </div>
                <Switch
                  id="gradual-start"
                  checked={settings.gradualStart}
                  onCheckedChange={(checked) => updateSetting("gradualStart", checked)}
                  data-testid="switch-gradual-start"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pause-punctuation" className="text-sm">Pause on Punctuation</Label>
                  <p className="text-xs text-muted-foreground">
                    Add extra pause after periods and commas
                  </p>
                </div>
                <Switch
                  id="pause-punctuation"
                  checked={settings.pauseOnPunctuation}
                  onCheckedChange={(checked) => updateSetting("pauseOnPunctuation", checked)}
                  data-testid="switch-pause-punctuation"
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
