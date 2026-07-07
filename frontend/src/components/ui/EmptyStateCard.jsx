import Button from "./Button";
import { EmptyStateIllustration } from "../illustrations/CareIllustrations";

export default function EmptyStateCard({
  title = "No data available",
  body = "Nothing to show yet.",
  actionLabel,
  onAction,
  illustration = "generic"
}) {
  return (
    <div className="glass-card tc-card tc-state-card overflow-hidden">
      <div className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex-shrink-0">
          <EmptyStateIllustration variant={illustration} />
        </div>
        <div className="max-w-md">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          {actionLabel ? (
            <div className="mt-4">
              <Button variant="secondary" onClick={onAction}>
                {actionLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
