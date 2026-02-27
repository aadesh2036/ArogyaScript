/**
 * LottiePlayer — loads Lottie JSON from /public/animations.
 * Falls back to a static SVG with CSS pulse if Lottie fails to load.
 *
 * Props:
 *   name        — filename without extension (e.g. "safe", "alert", "scan")
 *   size        — pixel size (default 48)
 *   loop        — whether to loop (default false)
 *   autoplay    — autoplay on mount (default true)
 *   play        — trigger play on demand (for action-triggered)
 *   className   — additional classes
 */

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import so Lottie never blocks SSR
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const FALLBACK_ICONS = {
  safe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-green-500 fallback-pulse">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-red-500 fallback-pulse">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  scan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 fallback-pulse">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  pill: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-purple-500 fallback-pulse">
      <path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  ),
};

export default function LottiePlayer({
  name = 'safe',
  size = 48,
  loop = false,
  autoplay = true,
  play = false,
  className = '',
}) {
  const [animData, setAnimData] = useState(null);
  const [failed, setFailed] = useState(false);
  const lottieRef = useRef(null);

  // Respect prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const handler = (e) => setReducedMotion(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  // Load Lottie JSON from /public/animations/{name}.json
  useEffect(() => {
    if (reducedMotion) return; // skip loading if reduced motion

    fetch(`/animations/${name}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => setAnimData(data))
      .catch(() => setFailed(true));
  }, [name, reducedMotion]);

  // Action-triggered play
  useEffect(() => {
    if (play && lottieRef.current) {
      lottieRef.current.goToAndPlay(0, true);
    }
  }, [play]);

  // Reduced motion or fallback → static icon with CSS pulse
  if (reducedMotion || failed || !animData) {
    const icon = FALLBACK_ICONS[name] || FALLBACK_ICONS.safe;
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label={`${name} status indicator`}
      >
        {icon}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${name} animation`}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
