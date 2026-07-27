import { DynamicState, DynamicStateObject } from "./../../types/DynamicState";
import Button from "./Button";
import { EmptyStateIllustration } from "../illustrations/CareIllustrations";
import Card from "./Card";
import { motion } from "framer-motion";

export interface EmptyStateCardProps {
  title?: DynamicState;
  body?: DynamicState;
  actionLabel?: DynamicState;
  onAction?: (...args: DynamicStateObject[]) => void;
  illustration?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function EmptyStateCard({
  title = "No data available",
  body = "Nothing to show yet.",
  actionLabel,
  onAction,
  illustration = "generic"
}: EmptyStateCardProps) {
  return (
    <Card elevated={false} className="tc-card tc-state-card overflow-hidden">
      <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-shrink-0"
        >
          <EmptyStateIllustration variant={illustration} />
        </motion.div>
        <div className="max-w-md w-full">
          <h3 className="text-lg font-semibold text-tc-text">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-tc-text-muted">{body}</p>
          {actionLabel ? (
            <div className="mt-6">
              <Button variant="secondary" onClick={onAction}>
                {actionLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
