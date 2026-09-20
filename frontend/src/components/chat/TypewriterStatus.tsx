import React, { useState, useEffect } from 'react';

interface TypewriterStatusProps {
  stage?: string | null;
  className?: string;
}

const DEFAULT_MESSAGES = [
  'Prakriti is reading context…',
  'Searching peer-reviewed corpus…',
  'Synthesizing evidence from reports…',
  'Formulating scientific assessment…',
];

export const TypewriterStatus: React.FC<TypewriterStatusProps> = ({ stage, className = '' }) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // If a specific stage is provided, map it; otherwise cycle through thoughtful stages
  const currentFullText = stage === 'auth'
    ? 'Connecting to research gateway…'
    : stage === 'retrieval'
    ? 'Searching peer-reviewed corpus…'
    : stage === 'reasoning' || stage === 'generation'
    ? 'Synthesizing evidence from reports…'
    : DEFAULT_MESSAGES[msgIndex % DEFAULT_MESSAGES.length];

  useEffect(() => {
    // If a static stage is provided, type it once
    if (stage) {
      setCharIndex(currentFullText.length);
      return;
    }

    const typingSpeed = isDeleting ? 25 : 45;
    const pauseDelay = 2200;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentFullText.length) {
          setCharIndex(prev => prev + 1);
        } else {
          // Pause at end of text before deleting
          setTimeout(() => setIsDeleting(true), pauseDelay);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(prev => prev - 1);
        } else {
          setIsDeleting(false);
          setMsgIndex(prev => (prev + 1) % DEFAULT_MESSAGES.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentFullText, stage]);

  const displayedText = currentFullText.slice(0, charIndex);

  return (
    <span className={`inline-flex items-center font-mono text-xs ${className}`}>
      <span>{displayedText}</span>
      <span className="w-1.5 h-3.5 ml-1 bg-[var(--color-accent-light)] animate-pulse inline-block align-middle" />
    </span>
  );
};
