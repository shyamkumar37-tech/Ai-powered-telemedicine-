import { motion } from 'framer-motion';
import { pageVariants } from '../utils/motionVariants';
import { useAccessibleAnimation } from '../hooks/useAccessibleAnimation';
import { ReactNode } from "react";

export interface PageTransitionProps {
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const accessibleVariants = useAccessibleAnimation(pageVariants);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={accessibleVariants}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
