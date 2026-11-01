import React, { useEffect, useState } from 'react';
import { soundEngine } from '../utils/soundEngine';

interface TypewriterTextProps {
  text: string;
  isActive: boolean;
  visitTrigger: number;
  speedMs?: number;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  isActive,
  visitTrigger,
  speedMs = 26,
  className = '',
}) => {
  const [displayedCount, setDisplayedCount] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setDisplayedCount(0);
      return;
    }

    setDisplayedCount(0);
    let current = 0;

    const interval = window.setInterval(() => {
      current += 1;
      setDisplayedCount(current);
      if (current <= text.length && current % 2 === 1) {
        const char = text[current - 1];
        soundEngine.playTypeTick(char === ' ');
      }
      if (current >= text.length) {
        window.clearInterval(interval);
      }
    }, speedMs);

    return () => window.clearInterval(interval);
  }, [text, isActive, visitTrigger, speedMs]);

  const visibleSlice = text.slice(0, displayedCount);
  const isTyping = isActive && displayedCount < text.length;

  return (
    <p
      className={`text-[#EAE6DF]/85 leading-relaxed tracking-wide ${className}`}
      aria-label={text}
    >
      <span>{visibleSlice}</span>
      <span
        aria-hidden="true"
        className={`inline-block w-[7px] h-[18px] ml-1.5 align-middle bg-[#EAE6DF]/75 transition-opacity ${
          isTyping ? 'opacity-90' : 'animate-pulse-slow'
        }`}
      />
    </p>
  );
};
