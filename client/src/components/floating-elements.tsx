import { motion } from "framer-motion";
import { BookOpen, Zap, Type, Gauge } from "lucide-react";

interface FloatingElement {
  id: number;
  icon: "book" | "zap" | "letter" | "gauge";
  size: number;
  x: string;
  y: string;
  delay: number;
  duration: number;
  rotate: number;
  opacity: number;
}

const defaultElements: FloatingElement[] = [
  { id: 1, icon: "book", size: 48, x: "10%", y: "20%", delay: 0, duration: 6, rotate: -12, opacity: 0.6 },
  { id: 2, icon: "zap", size: 32, x: "85%", y: "15%", delay: 0.5, duration: 7, rotate: 15, opacity: 0.5 },
  { id: 3, icon: "letter", size: 56, x: "75%", y: "70%", delay: 1, duration: 8, rotate: -8, opacity: 0.4 },
  { id: 4, icon: "gauge", size: 40, x: "5%", y: "75%", delay: 1.5, duration: 6.5, rotate: 20, opacity: 0.5 },
  { id: 5, icon: "book", size: 36, x: "90%", y: "45%", delay: 2, duration: 7.5, rotate: -5, opacity: 0.4 },
  { id: 6, icon: "letter", size: 44, x: "20%", y: "55%", delay: 0.8, duration: 6, rotate: 10, opacity: 0.35 },
  { id: 7, icon: "zap", size: 28, x: "60%", y: "10%", delay: 1.2, duration: 8, rotate: -18, opacity: 0.45 },
];

const IconComponent = ({ type, size }: { type: FloatingElement["icon"]; size: number }) => {
  const iconClass = "text-primary";
  switch (type) {
    case "book":
      return <BookOpen className={iconClass} style={{ width: size, height: size }} />;
    case "zap":
      return <Zap className={iconClass} style={{ width: size, height: size }} />;
    case "gauge":
      return <Gauge className={iconClass} style={{ width: size, height: size }} />;
    case "letter":
      return (
        <span 
          className="font-mono font-bold gradient-text select-none"
          style={{ fontSize: size }}
        >
          A
        </span>
      );
    default:
      return null;
  }
};

interface FloatingElementsProps {
  elements?: FloatingElement[];
  className?: string;
}

export function FloatingElements({ elements = defaultElements, className = "" }: FloatingElementsProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className="absolute"
          style={{
            left: el.x,
            top: el.y,
            opacity: el.opacity,
          }}
          initial={{ 
            y: 0, 
            rotate: el.rotate,
            scale: 0.8,
            opacity: 0 
          }}
          animate={{ 
            y: [0, -20, 0],
            rotate: [el.rotate, el.rotate + 5, el.rotate],
            scale: 1,
            opacity: el.opacity
          }}
          transition={{
            y: {
              duration: el.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: el.delay,
            },
            rotate: {
              duration: el.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: el.delay,
            },
            scale: {
              duration: 0.5,
              delay: el.delay,
            },
            opacity: {
              duration: 0.5,
              delay: el.delay,
            }
          }}
        >
          <IconComponent type={el.icon} size={el.size} />
        </motion.div>
      ))}
    </div>
  );
}

export function FloatingElementsLight() {
  const lightElements: FloatingElement[] = [
    { id: 1, icon: "book", size: 32, x: "8%", y: "25%", delay: 0, duration: 7, rotate: -8, opacity: 0.25 },
    { id: 2, icon: "zap", size: 24, x: "92%", y: "20%", delay: 0.8, duration: 8, rotate: 12, opacity: 0.2 },
    { id: 3, icon: "gauge", size: 28, x: "88%", y: "75%", delay: 1.5, duration: 6, rotate: -6, opacity: 0.2 },
  ];
  
  return <FloatingElements elements={lightElements} />;
}
