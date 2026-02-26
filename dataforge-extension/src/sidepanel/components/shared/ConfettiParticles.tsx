import React, { useEffect, useState, useRef, useMemo } from 'react';

export interface ConfettiParticlesProps {
  /** When true, triggers a burst of confetti particles */
  active: boolean;
  /** Number of particles (8-12 recommended) */
  count?: number;
  /** Animation duration in ms */
  duration?: number;
  /** Additional classes on the container */
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Particle config                                                           */
/* -------------------------------------------------------------------------- */

interface Particle {
  id: number;
  /** Angle in radians for outward arc */
  angle: number;
  /** Distance to travel */
  distance: number;
  /** Particle color */
  color: string;
  /** Particle size in px */
  size: number;
  /** Random rotation target */
  rotation: number;
  /** Slight delay offset */
  delay: number;
}

const COLORS = [
  '#10B981', // emerald
  '#14B8A6', // teal
  '#34D399', // emerald lighter
  '#5EEAD4', // teal lighter
  '#059669', // emerald darker
  '#0D9488', // teal darker
];

function createParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angleSpread = (Math.PI * 2 * i) / count;
    // Add some randomness
    const jitter = (Math.random() - 0.5) * 0.6;
    particles.push({
      id: i,
      angle: angleSpread + jitter,
      distance: 30 + Math.random() * 50,
      color: COLORS[i % COLORS.length],
      size: 3 + Math.random() * 4,
      rotation: Math.random() * 720 - 360,
      delay: Math.random() * 80,
    });
  }
  return particles;
}

/* -------------------------------------------------------------------------- */
/*  ConfettiParticles                                                         */
/* -------------------------------------------------------------------------- */

/**
 * ConfettiParticles - Celebration effect with 8-12 small emerald/teal dots
 * that arc outward and fade over 800ms.
 *
 * Features:
 *  - Triggered by `active` prop transitioning to true
 *  - Each particle arcs outward at random angles
 *  - Fade + scale down as they travel
 *  - 800ms total animation duration
 *  - Respects prefers-reduced-motion (instant fade only)
 */
const ConfettiParticles: React.FC<ConfettiParticlesProps> = ({
  active,
  count = 10,
  duration = 800,
  className = '',
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animating, setAnimating] = useState(false);
  const prevActiveRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Check reduced motion
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
    [],
  );

  // Trigger on active rising edge
  useEffect(() => {
    if (active && !prevActiveRef.current) {
      const newParticles = createParticles(count);
      setParticles(newParticles);
      // Trigger animation on next frame so initial state renders first
      requestAnimationFrame(() => {
        setAnimating(true);
      });

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setAnimating(false);
        setParticles([]);
      }, duration + 100);
    }
    prevActiveRef.current = active;

    return () => clearTimeout(timerRef.current);
  }, [active, count, duration]);

  if (particles.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      <div className="relative w-full h-full">
        {particles.map((p) => {
          const tx = Math.cos(p.angle) * p.distance;
          const ty = Math.sin(p.angle) * p.distance;

          return (
            <span
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                left: '50%',
                top: '50%',
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                opacity: animating ? 0 : 1,
                transform: animating
                  ? `translate(${tx}px, ${ty}px) rotate(${p.rotation}deg) scale(0.3)`
                  : 'translate(0, 0) rotate(0deg) scale(1)',
                transition: reducedMotion
                  ? 'opacity 0.2s ease-out'
                  : `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}ms`,
                boxShadow: `0 0 4px ${p.color}80`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ConfettiParticles;
