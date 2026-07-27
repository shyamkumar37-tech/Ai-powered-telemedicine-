import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import { motion } from "framer-motion";

import { tapScale, spring } from "../../utils/motionVariants";
import { useAccessibleAnimation } from "../../hooks/useAccessibleAnimation";
import { ReactNode } from "react";

export interface ButtonProps {
  variant?: DynamicState;
  size?: DynamicState;
  className?: DynamicState;
  type?: DynamicState;
  loading?: DynamicState;
  leftIcon?: DynamicState;
  rightIcon?: DynamicState;
  children?: ReactNode;
  props?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  loading = false,
  leftIcon = null,
  rightIcon = null,
  children,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clinic/30 disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
    outline: "btn-outline",
    ghost: "btn-ghost"
  };
  const sizes = {
    sm: "text-sm px-4 py-2",
    md: "text-sm px-5 py-3",
    lg: "text-base px-6 py-3.5"
  };
  const classes = [base, (variants as DynamicStateObject)[variant] || variants.primary, (sizes as DynamicStateObject)[size] || sizes.md, className]
    .filter(Boolean)
    .join(" ");

  const accessibleTapScale = useAccessibleAnimation(tapScale);

  return (
    <motion.button 
      type={type} 
      className={classes} 
      disabled={loading || props.disabled}
      // @ts-expect-error - Auto-suppressed during migration
      whileHover={{ scale: (loading || props.disabled) ? 1 : 1.02, transition: spring.snappy }}
      whileTap={(loading || props.disabled) ? {} : accessibleTapScale}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : leftIcon}
      <span>{children}</span>
      {!loading ? rightIcon : null}
    </motion.button>
  );
}
