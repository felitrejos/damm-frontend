"use client";

import * as React from "react";
import { IconCloudUpload, IconFileText, IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Decorative-only — drop zone shows the user *how* they could upload data
// in a real version, but no upload happens. The seeded backend already has
// 12k+ orders waiting for the planner.
export function ImportOrdersModal({ open, onOpenChange }: Props) {
  const [file, setFile] = React.useState<File | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setDragActive(false);
    }
  }, [open]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFile(files[0] ?? null);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import orders</DialogTitle>
          <DialogDescription>
            Upload a CSV with new orders. Required columns: customer_id,
            material_id, quantity, sales_unit. Optional: due_date.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border bg-surface-2 hover:bg-muted/40",
            )}
          >
            {file ? (
              <>
                <IconFileText className="size-8 text-primary" aria-hidden />
                <div className="text-[13px] font-medium text-ink">
                  {file.name}
                </div>
                <div className="text-[11px] text-ink-subtle">
                  {formatBytes(file.size)} · ready to import
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <IconX className="size-3.5" aria-hidden />
                  Remove
                </Button>
              </>
            ) : (
              <>
                <IconCloudUpload
                  className="size-9 text-ink-subtle"
                  aria-hidden
                />
                <div className="text-[13px] font-medium text-ink">
                  Drop your CSV here, or click to browse
                </div>
                <div className="text-[11px] text-ink-subtle">
                  Only .csv files
                </div>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!file}
            onClick={() => onOpenChange(false)}
          >
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
