// @ts-nocheck
import { motion } from "framer-motion";
import { DynamicStateObject } from "./../../types/DynamicState";

export default function DashboardSkeleton() {
  const shimmer = {
    hidden: { opacity: 0.5 },
    visible: {
      opacity: 1,
      transition: { repeat: Infinity, duration: 1.5, repeatType: "reverse", ease: "easeInOut" }
    }
  };

  return (
    <div className="space-y-6">
      <motion.div variants={shimmer} initial="hidden" animate="visible" className="h-24 w-full rounded-2xl bg-tc-surface-elevated" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i: DynamicStateObject) => (
          <motion.div key={i} variants={shimmer} initial="hidden" animate="visible" className="h-32 w-full rounded-2xl bg-tc-surface-elevated" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={shimmer} initial="hidden" animate="visible" className="h-[400px] w-full rounded-2xl bg-tc-surface-elevated" />
        <motion.div variants={shimmer} initial="hidden" animate="visible" className="h-[400px] w-full rounded-2xl bg-tc-surface-elevated" />
      </div>
    </div>
  );
}
