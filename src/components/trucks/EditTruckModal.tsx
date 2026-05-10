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
import { updateTruck, type Truck } from "@/lib/api/catalog";

const formSchema = z.object({
  plate: z.string().min(1, "Required"),
  capacity_pallets: z.coerce.number().int().min(1).max(20),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  truck: Truck | null;
};

export function EditTruckModal({ open, onOpenChange, truck }: Props) {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { plate: "", capacity_pallets: 6 },
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !truck) return;
    form.reset({
      plate: truck.plate ?? "",
      capacity_pallets: truck.capacity_pallets,
    });
    setErrorMsg(null);
  }, [open, truck, form]);

  if (!truck) return null;

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await updateTruck(truck.id, data);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not update truck");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit truck</DialogTitle>
          <DialogDescription>Update the truck&apos;s details.</DialogDescription>
        </DialogHeader>

        <form
          id="edit-truck-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="et-plate">Plate</Label>
            <Input id="et-plate" {...form.register("plate")} />
            {form.formState.errors.plate && (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.plate.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="et-capacity_pallets">Capacity (pallets)</Label>
            <Input
              id="et-capacity_pallets"
              type="number"
              min={1}
              max={20}
              {...form.register("capacity_pallets")}
            />
            {form.formState.errors.capacity_pallets && (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.capacity_pallets.message}
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
          <Button type="submit" form="edit-truck-form" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
