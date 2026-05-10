"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDriver } from "@/lib/api/catalog";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddDriverModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createDriver(data);
      onOpenChange(false);
      form.reset();
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not create driver");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
      setErrorMsg(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add driver</DialogTitle>
          <DialogDescription>
            New drivers start with no zone history; the planner picks them up
            once they&apos;ve done a few transports.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-driver-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="d-name">Name</Label>
            <Input
              id="d-name"
              placeholder="e.g. Maria Lopez"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {errorMsg && (
            <p className="text-[12px] text-destructive">{errorMsg}</p>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-driver-form" disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
