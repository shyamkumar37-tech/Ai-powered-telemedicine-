import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring, motion } from "framer-motion";
import { useAccessibleAnimation } from "../../hooks/useAccessibleAnimation";

export interface AnimatedCounterProps {
  value?: DynamicState;
  direction?: DynamicState;
  className?: DynamicState;
  formatter?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AnimatedCounter({
  value,
  direction = "up",
  className = "",
  formatter = (v: DynamicStateObject) => Math.round(v).toLocaleString(),
}: AnimatedCounterProps) {
  const ref = useRef<DynamicState>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  // Base motion value starts at 0 or the value depending on if it's visible yet
  const motionValue = useMotionValue(direction === "down" ? value * 1.5 : 0);
  
  // Spring physics for premium snappy counting
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  // Respect reduced motion
  const { transition } = useAccessibleAnimation({});
  const isReduced = transition?.duration === 0.01;

  useEffect(() => {
    if (isInView && !isReduced) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value, isReduced]);

  useEffect(() => {
    // Update the DOM node when spring updates
    return springValue.on("change", (latest: DynamicStateObject) => {
      if (ref.current && !isReduced) {
        ref.current.textContent = formatter(latest);
      }
    });
  }, [springValue, formatter, isReduced]);

  // If reduced motion, just show the final value
  return (
    <span ref={ref} className={className}>
      {isReduced ? formatter(value) : formatter(springValue.get())}
    </span>
  );
}
