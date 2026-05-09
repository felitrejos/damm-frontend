import { Button } from "@/components/ui/button";

type RemoteDataStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function RemoteDataState({
  title,
  description,
  actionLabel,
  onAction,
}: RemoteDataStateProps) {
  return (
    <div className="rounded-lg border bg-card px-5 py-8 text-center">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-ink-subtle">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
