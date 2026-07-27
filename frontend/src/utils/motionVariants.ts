import { Variants } from "framer-motion";

// Core spring configurations for a premium, physical feel (Linear/Stripe style)
export const spring = {
  soft: { type: "spring", stiffness: 300, damping: 30 },
  snappy: { type: "spring", stiffness: 400, damping: 25 },
  bouncy: { type: "spring", stiffness: 500, damping: 20 },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 15, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1, transition: spring.soft as any },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } }
};

export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02
    }
  }
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: spring.soft as any }
};

export const hoverScale = {
  scale: 1.02,
  transition: spring.snappy
};

export const tapScale = {
  scale: 0.98,
  transition: spring.snappy
};

export const hoverLift = {
  y: -4,
  boxShadow: "0px 10px 30px -5px rgba(0, 0, 0, 0.2)",
  transition: spring.snappy
};

export const modalDropIn = {
  initial: { opacity: 0, scale: 0.95, y: -20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15, ease: "easeIn" } }
};

export const toastSlide = {
  initial: { opacity: 0, x: 50, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};
