"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconCalendar } from "@tabler/icons-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { sampleClients } from "@/components/clients/sample-data";
import { sampleDrivers } from "@/components/drivers/sample-data";
import { sampleTrucks } from "@/components/trucks/sample-data";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientPicker } from "./ClientPicker";

const formSchema = z.object({
  driver_id: z.string().min(1, "Required"),
  truck_id: z.string().min(1, "Required"),
  client_ids: z.array(z.number()).min(1, "Pick at least one client"),
  date: z.string().min(1, "Required"),
});

type FormData = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerId: number;
};

const today = () => new Date().toISOString().slice(0, 10);

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

export function AddRouteModal({ open, onOpenChange, centerId }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      driver_id: "",
      truck_id: "",
      client_ids: [],
      date: today(),
    },
  });

  const onSubmit = (data: FormData) => {
    // No endpoint yet — drop the form per the agreed scope.
    // eslint-disable-next-line no-console
    console.log("[AddRouteModal] submit (no endpoint):", { centerId, ...data });
    onOpenChange(false);
    form.reset();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Add route</DialogTitle>
          <DialogDescription>
            Plan a delivery route from this center.
          </DialogDescription>
        </DialogHeader>

        <form
          id="add-route-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-2"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="driver">Driver</Label>
              <Select
                value={form.watch("driver_id")}
                onValueChange={(v) =>
                  form.setValue("driver_id", v ?? "", { shouldValidate: true })
                }
              >
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {sampleDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.driver_id ? (
                <p className="text-[12px] text-destructive">
                  {form.formState.errors.driver_id.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="truck">Truck</Label>
              <Select
                value={form.watch("truck_id")}
                onValueChange={(v) =>
                  form.setValue("truck_id", v ?? "", { shouldValidate: true })
                }
              >
                <SelectTrigger id="truck">
                  <SelectValue placeholder="Choose a truck" />
                </SelectTrigger>
                <SelectContent>
                  {sampleTrucks.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.code} · {t.truck_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.truck_id ? (
                <p className="text-[12px] text-destructive">
                  {form.formState.errors.truck_id.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="date">Date</Label>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          id="date"
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
          </div>

          <div className="grid gap-1.5">
            <Label>Clients</Label>
            <Controller
              control={form.control}
              name="client_ids"
              render={({ field }) => (
                <ClientPicker
                  clients={sampleClients}
                  selectedIds={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {form.formState.errors.client_ids ? (
              <p className="text-[12px] text-destructive">
                {form.formState.errors.client_ids.message}
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
          <Button type="submit" form="add-route-form">
            Create route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
