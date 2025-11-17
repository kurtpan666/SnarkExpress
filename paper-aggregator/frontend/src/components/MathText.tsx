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
    // Escape HTML to prevent XSS
    let result = inputText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');

    // Replace display math first ($$...$$ and \[...\]) to avoid conflicts with inline
    // Use non-greedy matching and handle multiline
    result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
      try {
        // Unescape the math content
        const unescapedMath = math
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/<br>/g, '\n');
        return katex.renderToString(unescapedMath, {
          displayMode: true,
          throwOnError: false,
          strict: false
        });
      } catch (e) {
        console.error('KaTeX render error for display math:', e);
        return match;
      }
    });

    result = result.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
      try {
        const unescapedMath = math
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/<br>/g, '\n');
        return katex.renderToString(unescapedMath, {
          displayMode: true,
          throwOnError: false,
          strict: false
        });
      } catch (e) {
        console.error('KaTeX render error for display math:', e);
        return match;
      }
    });

    // Replace inline math ($...$ and \(...\))
    // Use more specific regex to avoid matching display math
    result = result.replace(/\$([^\s$][^$]*?[^\s$]|\S)\$/g, (match, math) => {
      try {
        const unescapedMath = math
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'");
        return katex.renderToString(unescapedMath, {
          displayMode: false,
          throwOnError: false,
          strict: false
        });
      } catch (e) {
        console.error('KaTeX render error for inline math:', e);
        return match;
      }
    });

    result = result.replace(/\\\((.*?)\\\)/g, (match, math) => {
      try {
        const unescapedMath = math
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'");
        return katex.renderToString(unescapedMath, {
          displayMode: false,
          throwOnError: false,
          strict: false
        });
      } catch (e) {
        console.error('KaTeX render error for inline math:', e);
        return match;
      }
    });

    return result;
  };

  return <div ref={containerRef} className={className} />;
}
