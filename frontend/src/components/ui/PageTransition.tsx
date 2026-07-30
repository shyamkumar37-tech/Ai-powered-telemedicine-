import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { motion } from "framer-motion";

import { useAccessibleAnimation } from "../../hooks/useAccessibleAnimation";
import { ReactNode } from "react";

export const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -10,
  }
};

export const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};

export interface PageTransitionProps {
  children?: ReactNode;
  className?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PageTransition({ children, className = "" }: PageTransitionProps) {
  const accessibleVariants = useAccessibleAnimation(pageVariants);

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={accessibleVariants}
      transition={pageTransition as any}
      className={`h-full w-full flex flex-col flex-1 min-h-0 min-w-0 ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
