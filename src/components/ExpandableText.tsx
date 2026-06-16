import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export const ExpandableText = ({ text, maxLines = 2, className = '' }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(textRef.current).lineHeight);
      const height = textRef.current.scrollHeight;
      const lines = Math.ceil(height / lineHeight);
      
      setShowButton(lines > maxLines);
    }
  }, [text, maxLines]);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      <p
        ref={textRef}
        className={`${className} transition-all duration-300 ${
          isExpanded ? 'animate-bounce-expand' : ''
        }`}
        style={{
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          overflow: isExpanded ? 'visible' : 'hidden',
          WebkitLineClamp: isExpanded ? 'unset' : maxLines,
        }}
      >
        {text}
      </p>
      
      {showButton && (
        <button
          onClick={toggleExpanded}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors mt-1"
        >
          {isExpanded ? (
            <>
              Read Less <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              Read More <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
};
