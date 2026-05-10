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
import { updateWarehouse, type Warehouse } from "@/lib/api/warehouses";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  postal_code: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center: Warehouse | null;
};

export function EditCenterModal({ open, onOpenChange, center }: Props) {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", city: "", postal_code: "", address: "" },
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Re-seed the form whenever a different center is opened.
  React.useEffect(() => {
    if (!open || !center) return;
    form.reset({
      name: center.name,
      city: center.city ?? "",
      postal_code: center.postal_code ?? "",
      address: center.address ?? "",
    });
    setErrorMsg(null);
  }, [open, center, form]);

  if (!center) return null;

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await updateWarehouse(center.id, data);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not update center");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit center</DialogTitle>
          <DialogDescription>Update warehouse details.</DialogDescription>
        </DialogHeader>

        <form
          id="edit-center-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="e-name">Name</Label>
            <Input id="e-name" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="e-city">City</Label>
            <Input id="e-city" {...form.register("city")} />
            {form.formState.errors.city ? (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.city.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="e-postal_code">Postal code</Label>
            <Input id="e-postal_code" {...form.register("postal_code")} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="e-address">Address</Label>
            <Input id="e-address" {...form.register("address")} />
          </div>

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
            Cancel
          </Button>
          <Button type="submit" form="edit-center-form" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
