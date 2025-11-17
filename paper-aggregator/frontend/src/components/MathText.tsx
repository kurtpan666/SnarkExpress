import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
}

export function MathText({ text, className = '' }: MathTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // Process text to render LaTeX math formulas
    const processedText = renderMath(text);
    container.innerHTML = processedText;
  }, [text]);

  const renderMath = (inputText: string): string => {
    // Replace inline math: $...$ or \(...\)
    let result = inputText.replace(/\$([^$]+)\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Replace inline math with \(...\)
    result = result.replace(/\\\(([^)]+)\\\)/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Replace display math: $$...$$ or \[...\]
    result = result.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: true, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Replace display math with \[...\]
    result = result.replace(/\\\[([^\]]+)\\\]/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: true, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    return result;
  };

  return <div ref={containerRef} className={className} />;
}
