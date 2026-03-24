import { useState, useEffect, useRef } from "react";
import { spinners, spinnerVerbs, timing } from "./design-system.js";

// ── Diamond Breathe — eased timing (200/130/100/100/130/200ms) ──
export function useDiamondBreathe(): string {
  const [frame, setFrame] = useState(0);
  const { frames, timing: frameTiming } = spinners.diamondBreathe;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, frameTiming[frame]);
    return () => clearTimeout(timer);
  }, [frame, frames.length, frameTiming]);

  return frames[frame]!;
}

// ── Braille Orbit — uniform 80ms (scanning) ──
export function useBrailleOrbit(): string {
  const [frame, setFrame] = useState(0);
  const { frames, timing: interval } = spinners.brailleOrbit;

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, interval);
    return () => clearInterval(timer);
  }, [frames.length, interval]);

  return frames[frame]!;
}

// ── Braille Grow — uniform 60ms (forming, building) ──
export function useBrailleGrow(): string {
  const [frame, setFrame] = useState(0);
  const { frames, timing: interval } = spinners.brailleGrow;

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, interval);
    return () => clearInterval(timer);
  }, [frames.length, interval]);

  return frames[frame]!;
}

// ── Pulse Dot — eased 200/150/200/150ms (measuring, probing) ──
export function usePulseDot(): string {
  const [frame, setFrame] = useState(0);
  const { frames, timing: frameTiming } = spinners.pulseDot;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, frameTiming[frame]);
    return () => clearTimeout(timer);
  }, [frame, frames.length, frameTiming]);

  return frames[frame]!;
}

// ── Pulse Circle — eased (for governor evaluating) ──
export function usePulseCircle(): string {
  const [frame, setFrame] = useState(0);
  const { frames, timing: frameTiming } = spinners.pulseCircle;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, frameTiming[frame]);
    return () => clearTimeout(timer);
  }, [frame, frames.length, frameTiming]);

  return frames[frame]!;
}

// ── Verb rotation — 2800ms exactly ──
export function useVerbRotation(stageCode: string): string {
  const [index, setIndex] = useState(0);
  const verbs = spinnerVerbs[stageCode] ?? ["Processing"];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % verbs.length);
    }, timing.verbRotation);
    return () => clearInterval(timer);
  }, [verbs.length]);

  return verbs[index]!;
}

// ── Elapsed timer ──
export function useElapsed(): number {
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return elapsed;
}

// ── Typewriter — progressive text reveal ──
export function useTypewriter(text: string, speed: number = 30): string {
  const [length, setLength] = useState(0);
  const textRef = useRef("");

  useEffect(() => {
    if (text !== textRef.current) {
      textRef.current = text;
      setLength(0);
    }
  }, [text]);

  useEffect(() => {
    const target = text.length;
    if (length >= target) return;
    const timer = setTimeout(() => {
      setLength((l) => Math.min(l + 1, target));
    }, speed);
    return () => clearTimeout(timer);
  }, [length, text.length, speed]);

  return text.slice(0, length);
}

// ── Count up — animated number from 0 to target ──
export function useCountUp(target: number, duration: number = 500): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCurrent(0);
      return;
    }
    const startTime = Date.now();
    let timerId: ReturnType<typeof setTimeout>;

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) {
        timerId = setTimeout(animate, 50);
      } else {
        setCurrent(target);
      }
    };

    timerId = setTimeout(animate, 50);
    return () => clearTimeout(timerId);
  }, [target, duration]);

  return current;
}

// ── Progress fill — bar filling animation (0→target) ──
export function useProgressFill(
  target: number,
  duration: number = 300,
): number {
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    let timerId: ReturnType<typeof setTimeout>;

    const animate = (): void => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quadratic
      const eased = 1 - Math.pow(1 - progress, 2);
      setFill(target * eased);
      if (progress < 1) {
        timerId = setTimeout(animate, 16);
      } else {
        setFill(target);
      }
    };

    timerId = setTimeout(animate, 16);
    return () => clearTimeout(timerId);
  }, [target, duration]);

  return fill;
}

// ── Crystallize — ◇ ◈ ◆ cycling spinner (200ms per frame, loops forever) ──
export function useCrystallize(): { step: number; done: boolean } {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 3);
    }, 220);
    return () => clearInterval(timer);
  }, []);

  return { step, done: false };
}

// ── Color flash — brief color on mount, fades to base ──
export function useColorFlash(
  flashColor: string,
  baseColor: string,
  duration: number = 100,
): string {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setActive(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return active ? flashColor : baseColor;
}
