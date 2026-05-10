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
import { updateDriver, type Driver } from "@/lib/api/catalog";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
};

export function EditDriverModal({ open, onOpenChange, driver }: Props) {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !driver) return;
    form.reset({ name: driver.name });
    setErrorMsg(null);
  }, [open, driver, form]);

  if (!driver) return null;

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await updateDriver(driver.id, data);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not update driver");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit driver</DialogTitle>
          <DialogDescription>Update the driver&apos;s name.</DialogDescription>
        </DialogHeader>

        <form
          id="edit-driver-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="ed-name">Name</Label>
            <Input id="ed-name" {...form.register("name")} />
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
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-driver-form" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
