import { forwardRef } from "react";

const Card = forwardRef(function Card({ className = "", elevated = true, children, ...props }, ref) {
  const classes = [elevated ? "glass-card" : "tc-surface-card", "p-6", className].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  );
});

export default Card;
