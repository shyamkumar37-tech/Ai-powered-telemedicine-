import { useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { DynamicStateObject } from "./../types/DynamicState";

export function useAccessibleAnimation(variants: DynamicStateObject) {
  const shouldReduceMotion = useReducedMotion();

  return useMemo(() => {
    if (!shouldReduceMotion) return variants;

    // Graceful degradation for reduced motion
    // Strip translations (x, y) and scales, keep opacity fades, but snap instantly
    const reducedVariants = {};
    // @ts-expect-error - Auto-suppressed during migration
    for (const key: DynamicStateObject in variants) {
      const variant = (variants as DynamicStateObject)[key];
      (reducedVariants as DynamicStateObject)[key] = { ...variant };
      
      if ((reducedVariants as DynamicStateObject)[key].y !== undefined) (reducedVariants as DynamicStateObject)[key].y = 0;
      if ((reducedVariants as DynamicStateObject)[key].x !== undefined) (reducedVariants as DynamicStateObject)[key].x = 0;
      if ((reducedVariants as DynamicStateObject)[key].scale !== undefined) (reducedVariants as DynamicStateObject)[key].scale = 1;
      
      // Force instantaneous transitions
      (reducedVariants as DynamicStateObject)[key].transition = { duration: 0.01 }; // Practically instant but triggers React lifecycle
    }
    return reducedVariants;
  }, [shouldReduceMotion, variants]);
}
