import { useMemo } from "react";

interface RSVPDisplayProps {
  word: string;
  fontSize: number;
}

function calculateORPIndex(word: string): number {
  const len = word.length;
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

export function RSVPDisplay({ word, fontSize }: RSVPDisplayProps) {
  const { before, pivot, after, pivotIndex } = useMemo(() => {
    if (!word) {
      return { before: "", pivot: "", after: "", pivotIndex: 0 };
    }
    
    const orpIndex = calculateORPIndex(word);
    return {
      before: word.slice(0, orpIndex),
      pivot: word[orpIndex] || "",
      after: word.slice(orpIndex + 1),
      pivotIndex: orpIndex,
    };
  }, [word]);

  if (!word) {
    return (
      <div 
        className="flex items-center justify-center font-mono"
        style={{ fontSize: `${fontSize}px` }}
      >
        <span className="text-muted-foreground">Ready</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center" data-testid="rsvp-display">
      <div className="absolute left-1/2 -translate-x-1/2 h-full flex items-center">
        <div className="w-0.5 h-3 bg-red-500 absolute -top-4" />
        <div className="w-0.5 h-3 bg-red-500 absolute -bottom-4" />
      </div>
      
      <div 
        className="flex items-center font-mono font-bold tracking-wide"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
      >
        <span 
          className="text-right text-foreground/90"
          style={{ minWidth: `${pivotIndex}ch` }}
        >
          {before}
        </span>
        <span className="text-red-500" data-testid="rsvp-pivot">
          {pivot}
        </span>
        <span className="text-left text-foreground/90">
          {after}
        </span>
      </div>
    </div>
  );
}
