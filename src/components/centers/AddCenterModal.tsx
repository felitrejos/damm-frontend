"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  center: z.string().min(1, "Required"),
  location: z.string().min(1, "Required"),
  admin: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof formSchema>;

const ZONES = ["Cataluña", "Levante", "Madrid", "Andalucía", "País Vasco"] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddCenterModal({ open, onOpenChange }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { center: "", location: "", admin: "" },
  });

  const onSubmit = (data: FormData) => {
    // No endpoint yet — drop the form per the agreed scope.
    // eslint-disable-next-line no-console
    console.log("[AddCenterModal] submit (no endpoint):", data);
    onOpenChange(false);
    form.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add center</DialogTitle>
          <DialogDescription>
            Register a new distribution center.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-center-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="center">Name</Label>
            <Input
              id="center"
              placeholder="e.g. Barcelona Norte"
              {...form.register("center")}
            />
            {form.formState.errors.center ? (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.center.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="location">Zone</Label>
            <Select
              value={form.watch("location")}
              onValueChange={(v) =>
                form.setValue("location", v ?? "", { shouldValidate: true })
              }
            >
              <SelectTrigger id="location">
                <SelectValue placeholder="Choose a zone" />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.location ? (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.location.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="admin">Admin</Label>
            <Input
              id="admin"
              placeholder="Admin contact name"
              {...form.register("admin")}
            />
            {form.formState.errors.admin ? (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.admin.message}
              </p>
            ) : null}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-center-form">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
