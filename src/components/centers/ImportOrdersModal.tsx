"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconCalendar } from "@tabler/icons-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { importSampleOrders, type ImportResponse } from "@/lib/api/orders";

const formSchema = z.object({
  date: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const isoToDate = (iso: string): Date | undefined => {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const dateToIso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatDate = (iso: string): string => {
  const d = isoToDate(iso);
  return d
    ? d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Pick a date";
};

const today = (): string => dateToIso(new Date());

export function ImportOrdersModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: today() },
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<ImportResponse | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setResult(null);
      setErrorMsg(null);
      setSubmitting(false);
      form.reset({ date: today() });
    }
  }, [open, form]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setErrorMsg(null);
    setResult(null);
    try {
      const res = await importSampleOrders(data.date);
      setResult(res);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import demo orders</DialogTitle>
          <DialogDescription>
            Loads the bundled sample CSV. All rows get the picked date as
            their due_date — pick the day you want to plan for.
          </DialogDescription>
        </DialogHeader>

        <form
          id="import-orders-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="import-date">Due date for imported orders</Label>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        id="import-date"
                        type="button"
                        variant="outline"
                        className="w-full justify-start font-normal"
                      />
                    }
                  >
                    <IconCalendar className="mr-2 size-4 opacity-60" />
                    {formatDate(field.value)}
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={isoToDate(field.value)}
                      onSelect={(d) => {
                        if (d) field.onChange(dateToIso(d));
                      }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {form.formState.errors.date ? (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.date.message}
              </p>
            ) : null}
          </div>

          {result ? (
            <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-[12px] text-success">
              {result.inserted} order{result.inserted === 1 ? "" : "s"}{" "}
              imported
              {result.skipped > 0 ? ` · ${result.skipped} skipped` : ""}.
            </p>
          ) : null}

          {errorMsg ? (
            <p className="text-[12px] text-destructive">{errorMsg}</p>
          ) : null}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {!result ? (
            <Button
              type="submit"
              form="import-orders-form"
              disabled={submitting}
            >
              {submitting ? "Importing..." : "Import"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
