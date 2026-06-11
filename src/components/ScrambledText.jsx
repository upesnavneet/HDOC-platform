import React, { useState, useEffect, useRef } from 'react';

export default function ScrambledText({ text, speed = 30, delay = 0, triggerOnHover = true }) {
  const [displayText, setDisplayText] = useState(text);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+-/<>[]{}';
  const intervalRef = useRef(null);
  const isScrambling = useRef(false);

  const startScramble = () => {
    if (isScrambling.current) return;
    isScrambling.current = true;
    let iteration = 0;

    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(intervalRef.current);
        isScrambling.current = false;
      }

      iteration += 1 / 3;
    }, speed);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      startScramble();
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalRef.current);
    };
  }, [text]);

  return (
    <span
      className="scrambled-text"
      onMouseEnter={triggerOnHover ? startScramble : undefined}
      style={{ cursor: triggerOnHover ? 'pointer' : 'default', display: 'inline-block' }}
    >
      {displayText}
    </span>
  );
}
