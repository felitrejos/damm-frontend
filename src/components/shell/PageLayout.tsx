type Props = {
  children: React.ReactNode;
};

/**
 * Right-pane content panel — rounded-xl surface-1 card on the canvas.
 * Page-level navigation (breadcrumb) lives in the outer Header, not here.
 */
export function PageLayout({ children }: Props) {
  return (
    <div className="ml-2 mr-2 mb-2 mt-1 md:ml-0 flex flex-col flex-1 min-h-0 rounded-xl bg-surface-1 overflow-hidden">
      <div className="overflow-y-auto flex-1 min-h-0">{children}</div>
    </div>
  );
}
