import { forwardRef } from "react";
import { motion } from "framer-motion";
import { hoverLift, spring } from "../../utils/motionVariants";
import { useAccessibleAnimation } from "../../hooks/useAccessibleAnimation";
import { DynamicStateObject } from "./../../types/DynamicState";

const Card = forwardRef(function Card({ className = "", elevated = true, children, animate = true, delay = 0, ...props }: DynamicStateObject, ref: DynamicStateObject) {
  const classes = [
    elevated ? "card-premium relative overflow-hidden" : "tc-surface-card relative overflow-hidden", 
    "p-6", 
    className
  ].filter(Boolean).join(" ");
  
  const accessibleHoverLift = useAccessibleAnimation(hoverLift);

  if (animate) {
    return (
      <motion.div
        ref={ref}
        className={classes}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.soft, delay }}
        whileHover={elevated ? accessibleHoverLift : {}}
        {...props}
      >
        {/* Subtle gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }

  return (
    <div ref={ref} className={classes} {...props}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
      <div className="relative z-10">{children}</div>
    </div>
  );
});

export default Card;
