/**
 * Animation Utilities for DataForge.
 *
 * All animations are GPU-accelerated (transform + opacity only).
 * Respects prefers-reduced-motion. Zero external dependencies.
 *
 * Accent palette: emerald #10B981 / teal #14B8A6
 */

// ---------------------------------------------------------------------------
// Easing functions
// ---------------------------------------------------------------------------

/** Cubic ease-out: decelerating to zero velocity. */
export function easeOutCubic(t: number): number {
  const t1 = t - 1;
  return t1 * t1 * t1 + 1;
}

/** Ease-out with slight overshoot (back). */
export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const t1 = t - 1;
  return 1 + c3 * t1 * t1 * t1 + c1 * t1 * t1;
}

/** Quadratic ease-in-out: acceleration then deceleration. */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

// ---------------------------------------------------------------------------
// Reduced motion check
// ---------------------------------------------------------------------------

/** Returns `true` if the user has NOT requested reduced motion. */
export function shouldAnimate(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  return !mq.matches;
}

// ---------------------------------------------------------------------------
// Spring animation
// ---------------------------------------------------------------------------

export interface SpringConfig {
  stiffness: number;
  damping: number;
}

/**
 * Creates a spring animation function that interpolates from `from` to `to`.
 *
 * Returns a function that, given elapsed time in seconds, returns the current
 * value. The spring settles when velocity drops below a threshold.
 *
 * @param from - Start value
 * @param to - End value
 * @param stiffness - Spring stiffness (default 180)
 * @param damping - Damping ratio (default 12)
 * @returns A function `(elapsedSec: number) => { value: number; done: boolean }`
 */
export function springAnimation(
  from: number,
  to: number,
  stiffness: number = 180,
  damping: number = 12,
): (elapsedSec: number) => { value: number; done: boolean } {
  const delta = to - from;
  const dampingRatio = damping / (2 * Math.sqrt(stiffness));
  const angularFreq = Math.sqrt(stiffness);

  // Velocity threshold for settling
  const REST_THRESHOLD = 0.001;
  const DISPLACEMENT_THRESHOLD = 0.001;

  return (elapsedSec: number) => {
    if (!shouldAnimate()) {
      return { value: to, done: true };
    }

    let displacement: number;
    let velocity: number;

    if (dampingRatio < 1) {
      // Under-damped: oscillates
      const dampedFreq = angularFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
      const envelope = Math.exp(-dampingRatio * angularFreq * elapsedSec);
      displacement =
        -delta *
        envelope *
        ((dampingRatio * angularFreq * Math.sin(dampedFreq * elapsedSec)) / dampedFreq +
          Math.cos(dampedFreq * elapsedSec));
      velocity =
        delta *
        envelope *
        ((dampingRatio * dampingRatio * angularFreq * angularFreq +
          dampedFreq * dampedFreq) *
          Math.sin(dampedFreq * elapsedSec)) /
        dampedFreq;
    } else {
      // Critically damped or over-damped
      const envelope = Math.exp(-angularFreq * elapsedSec);
      displacement = -delta * envelope * (1 + angularFreq * elapsedSec);
      velocity =
        delta * angularFreq * angularFreq * elapsedSec * envelope;
    }

    const currentValue = to + displacement;
    const done =
      Math.abs(displacement) < DISPLACEMENT_THRESHOLD &&
      Math.abs(velocity) < REST_THRESHOLD;

    return { value: done ? to : currentValue, done };
  };
}

// ---------------------------------------------------------------------------
// FLIP animation helper
// ---------------------------------------------------------------------------

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * FLIP (First, Last, Invert, Play) animation helper.
 *
 * Calculates the transform needed to move an element from its `first`
 * position to its `last` position, applies the inversion, and plays the
 * transition using GPU-accelerated transforms.
 *
 * @param element - The DOM element to animate
 * @param first - Rect captured before the layout change
 * @param last - Rect captured after the layout change
 * @param duration - Animation duration in ms (default 300)
 */
export function flipAnimation(
  element: HTMLElement,
  first: Rect,
  last: Rect,
  duration: number = 300,
): void {
  if (!shouldAnimate()) return;

  const deltaX = first.left - last.left;
  const deltaY = first.top - last.top;
  const scaleX = first.width / (last.width || 1);
  const scaleY = first.height / (last.height || 1);

  // Skip if there is no meaningful change
  if (
    Math.abs(deltaX) < 0.5 &&
    Math.abs(deltaY) < 0.5 &&
    Math.abs(scaleX - 1) < 0.01 &&
    Math.abs(scaleY - 1) < 0.01
  ) {
    return;
  }

  // Invert: apply the inverse transform so element appears in the first position
  element.style.transformOrigin = '0 0';
  element.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`;
  element.style.transition = 'none';

  // Force a reflow so the browser captures the inverted state
  void element.offsetHeight;

  // Play: animate to the identity transform (the final position)
  element.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  element.style.transform = 'translate3d(0, 0, 0) scale(1, 1)';

  const cleanup = (): void => {
    element.style.transform = '';
    element.style.transition = '';
    element.style.transformOrigin = '';
    element.removeEventListener('transitionend', cleanup);
  };

  element.addEventListener('transitionend', cleanup, { once: true });

  // Safety cleanup in case transitionend never fires
  setTimeout(cleanup, duration + 50);
}

// ---------------------------------------------------------------------------
// Stagger delay
// ---------------------------------------------------------------------------

/**
 * Calculates stagger delay for list animations.
 *
 * Uses an eased curve so earlier items feel snappy while later items
 * have slightly longer delays, preventing a machine-gun feel.
 *
 * @param index - The item's zero-based index
 * @param baseDelay - Base delay per item in ms (default 30)
 * @returns Delay in ms
 */
export function staggerDelay(index: number, baseDelay: number = 30): number {
  if (!shouldAnimate()) return 0;
  // Logarithmic curve: each subsequent item has a slightly smaller increment
  return Math.round(baseDelay * Math.log2(index + 2));
}

// ---------------------------------------------------------------------------
// Number animation
// ---------------------------------------------------------------------------

/**
 * Smoothly animate a number from `from` to `to` over `duration` ms.
 *
 * Uses `requestAnimationFrame` for smooth 60fps updates and `easeOutCubic`
 * easing. The callback receives the current interpolated value (rounded to
 * the nearest integer).
 *
 * @param from - Start value
 * @param to - End value
 * @param duration - Duration in milliseconds
 * @param callback - Called on each frame with the interpolated value
 * @returns A cancel function
 */
export function animateNumber(
  from: number,
  to: number,
  duration: number,
  callback: (value: number) => void,
): () => void {
  if (!shouldAnimate() || duration <= 0) {
    callback(to);
    return () => {};
  }

  let rafId: number | null = null;
  let cancelled = false;
  const startTime = performance.now();
  const delta = to - from;

  function tick(now: number): void {
    if (cancelled) return;

    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);
    const currentValue = Math.round(from + delta * easedProgress);

    callback(currentValue);

    if (progress < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      callback(to); // Ensure exact final value
    }
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

// ---------------------------------------------------------------------------
// Particle burst (confetti effect)
// ---------------------------------------------------------------------------

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  element: HTMLDivElement;
}

/**
 * Creates a particle burst at the specified coordinates.
 *
 * Particles are absolutely positioned `div` elements with GPU-accelerated
 * transforms. They fly outward and fade over ~600ms, then self-clean.
 *
 * @param x - Center X coordinate (viewport-relative)
 * @param y - Center Y coordinate (viewport-relative)
 * @param count - Number of particles (default 12)
 * @param color - Particle color (default emerald #10B981)
 * @returns A cleanup function that immediately removes all particles
 */
export function createParticles(
  x: number,
  y: number,
  count: number = 12,
  color: string = '#10B981',
): () => void {
  if (!shouldAnimate()) return () => {};

  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;overflow:hidden;';
  document.documentElement.appendChild(container);

  const particles: Particle[] = [];
  const LIFETIME_MS = 600;
  const GRAVITY = 0.15;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    const size = 3 + Math.random() * 4;

    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      pointer-events: none;
      will-change: transform, opacity;
      transform: translate3d(${x}px, ${y}px, 0);
      opacity: 1;
    `;
    container.appendChild(el);

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // Slight upward bias
      size,
      opacity: 1,
      color,
      element: el,
    });
  }

  let rafId: number | null = null;
  let startTime: number | null = null;
  let cleaned = false;

  function cleanup(): void {
    if (cleaned) return;
    cleaned = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    container.remove();
  }

  function animate(now: number): void {
    if (cleaned) return;
    if (startTime === null) startTime = now;

    const elapsed = now - startTime;
    const progress = elapsed / LIFETIME_MS;

    if (progress >= 1) {
      cleanup();
      return;
    }

    for (const p of particles) {
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.opacity = 1 - easeOutCubic(progress);

      p.element.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      p.element.style.opacity = String(p.opacity);
    }

    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);

  // Safety cleanup
  setTimeout(cleanup, LIFETIME_MS + 100);

  return cleanup;
}
