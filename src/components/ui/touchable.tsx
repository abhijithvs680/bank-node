import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RippleData {
  x: number;
  y: number;
  id: number;
}

interface TouchableProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export const Touchable = ({ children, onClick, className, disabled }: TouchableProps) => {
  const [ripples, setRipples] = useState<RippleData[]>([]);

  const handleInteraction = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else if ('clientX' in e) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else {
      x = rect.width / 2;
      y = rect.height / 2;
    }

    const rippleId = Date.now();
    setRipples(prev => [...prev, { x, y, id: rippleId }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);

    onClick();
  }, [onClick, disabled]);

  return (
    <div
      onClick={handleInteraction}
      className={cn(
        "relative overflow-hidden cursor-pointer touch-item select-none",
        "active:scale-[0.98] transition-transform duration-100",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          onClick();
        }
      }}
    >
      {children}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-medical-primary/25 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 20,
            height: 20,
            marginLeft: -10,
            marginTop: -10,
          }}
        />
      ))}
    </div>
  );
};
