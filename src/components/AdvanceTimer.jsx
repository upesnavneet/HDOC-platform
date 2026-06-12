import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function AdvanceTimer({ hideIcon = false }) {
  const { db } = useApp();
  const lastDayAdvanceTime = db?.lastDayAdvanceTime;
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!lastDayAdvanceTime) return;

    // Run once immediately
    const calculateTime = () => {
      const now = new Date();
      const endTime = new Date(lastDayAdvanceTime.getTime() + 24 * 60 * 60 * 1000);
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    };
    
    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [lastDayAdvanceTime]);

  if (!lastDayAdvanceTime) return null;

  return (
    <div className="advance-timer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'monospace', fontWeight: 700, fontSize: 'inherit', color: 'inherit' }}>
      {!hideIcon && (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '-2px' }}>
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      )}
      <span>
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
