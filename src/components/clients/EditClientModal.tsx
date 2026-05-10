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
import { updateCustomer, type Customer } from "@/lib/api/catalog";

const formSchema = z.object({
  name: z.string().min(1, "Required"),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Customer | null;
};

export function EditClientModal({ open, onOpenChange, client }: Props) {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", city: "", postal_code: "", address: "" },
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !client) return;
    form.reset({
      name: client.name,
      city: client.city ?? "",
      postal_code: client.postal_code ?? "",
      address: client.address ?? "",
    });
    setErrorMsg(null);
  }, [open, client, form]);

  if (!client) return null;

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await updateCustomer(client.id, data);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not update client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit client</DialogTitle>
          <DialogDescription>Update customer details.</DialogDescription>
        </DialogHeader>

        <form
          id="edit-client-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="ec-name">Name</Label>
            <Input id="ec-name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ec-city">City</Label>
            <Input id="ec-city" {...form.register("city")} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ec-postal_code">Postal code</Label>
            <Input id="ec-postal_code" {...form.register("postal_code")} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="ec-address">Address</Label>
            <Input id="ec-address" {...form.register("address")} />
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
          <Button type="submit" form="edit-client-form" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
