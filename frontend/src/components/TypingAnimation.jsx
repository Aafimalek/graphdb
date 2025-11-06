import { useState, useEffect, useRef } from 'react';

const TypingAnimation = ({ text, speed = 30, onComplete, skipAnimation = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isSkipped, setIsSkipped] = useState(skipAnimation);
  const indexRef = useRef(0);

  // Reset state when text changes (for history navigation)
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    setIsSkipped(skipAnimation);
    indexRef.current = 0;
  }, [text, skipAnimation]);

  useEffect(() => {
    if (isSkipped) {
      setDisplayedText(text);
      setIsComplete(true);
      if (onComplete) onComplete();
      return;
    }

    if (indexRef.current < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      }, speed);

      return () => clearTimeout(timeout);
    } else if (!isComplete) {
      setIsComplete(true);
      if (onComplete) onComplete();
    }
  }, [displayedText, text, speed, isComplete, isSkipped, onComplete]);

  const handleSkip = () => {
    setIsSkipped(true);
  };

  return (
    <div className="relative">
      <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
        {displayedText}
        {!isComplete && <span className="animate-pulse">|</span>}
      </p>
      {!isComplete && !isSkipped && (
        <button
          onClick={handleSkip}
          className="absolute -bottom-8 right-0 text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          Skip animation
        </button>
      )}
    </div>
  );
};

export default TypingAnimation;

