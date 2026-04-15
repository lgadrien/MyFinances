/**
 * src/hooks/useCountUp.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Anime un nombre de 0 jusqu'à `target` en `duration` ms.
 * Utilise requestAnimationFrame pour 60fps, easing ease-out cubique.
 *
 * Usage :
 *   const displayed = useCountUp(totalInvested, { duration: 1200 });
 */

import { useEffect, useRef, useState } from "react";

interface CountUpOptions {
  /** Durée totale de l'animation en ms (défaut: 1000) */
  duration?: number;
  /** Délai avant le démarrage en ms (défaut: 0) */
  delay?: number;
  /** Si true, ne rejoue pas l'animation quand `target` change légèrement */
  skipSmallChanges?: boolean;
}

export function useCountUp(
  target: number,
  { duration = 1000, delay = 0, skipSmallChanges = false }: CountUpOptions = {},
): number {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number | null>(null);
  const previousTarget = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Safety check: if target is NaN, don't trigger animation
    if (Number.isNaN(target)) {
      setCurrent(0);
      return;
    }

    // Ignore les changements inférieurs à 1% si skipSmallChanges
    if (
      skipSmallChanges &&
      previousTarget.current !== 0 &&
      Math.abs(target - previousTarget.current) / previousTarget.current < 0.01
    ) {
      setCurrent(target);
      return;
    }

    const startValue = previousTarget.current;
    previousTarget.current = target;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing ease-out cubique : décélère vers la fin
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = startValue + (target - startValue) * eased;

        setCurrent(value);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(step);
        }
      };

      frameRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [target, duration, delay, skipSmallChanges]);

  return current;
}
