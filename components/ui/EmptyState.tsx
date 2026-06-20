import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-16 px-8",
        "border border-dashed border-port-border rounded-panel",
        "bg-port-panel/40",
        className
      )}
    >
      {icon && (
        <div className="text-steel mb-4 opacity-60">{icon}</div>
      )}
      <p className="font-display text-panel-title text-fog font-medium mb-2">{title}</p>
      {description && (
        <p className="font-body text-table text-steel max-w-sm">{description}</p>
      )}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-16 px-8",
        "border border-red-failed/20 rounded-panel",
        "bg-red-failed/5",
        className
      )}
    >
      <div className="w-8 h-8 rounded-full bg-red-failed/15 flex items-center justify-center mb-4">
        <span className="text-red-failed text-base">!</span>
      </div>
      <p className="font-display text-panel-title text-signal font-medium mb-1">{title}</p>
      <p className="font-body text-table text-fog max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-6">
          Retry
        </Button>
      )}
    </div>
  );
}
