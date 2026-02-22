"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Appointment {
  id: string;
  date: string;
  time: string;
  reason: string;
  status: "CONFIRMED" | "CANCELED" | "COMPLETED";
  petId: string;
  vetId: string;
  pet: {
    name: string;
    species: string;
    owner: {
      name: string;
    };
  };
}

interface Vet {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface EditAppointmentDialogProps {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Generate time slots from 9:00 AM to 5:00 PM in 30-minute intervals
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour;
      const displayTime = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
      slots.push({ value: time, label: displayTime });
    }
  }
  return slots;
};

export default function EditAppointmentDialog({
  open,
  appointment,
  onClose,
  onSuccess,
}: EditAppointmentDialogProps) {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    reason: "",
    status: "CONFIRMED" as "CONFIRMED" | "CANCELED" | "COMPLETED",
    vetId: "",
  });

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (open && appointment) {
      // Format date for input (YYYY-MM-DD)
      const dateObj = new Date(appointment.date);
      const formattedDate = dateObj.toISOString().split("T")[0];

      setFormData({
        date: formattedDate,
        time: appointment.time,
        reason: appointment.reason,
        status: appointment.status,
        vetId: appointment.vetId,
      });
      fetchVets();
    }
  }, [open, appointment]);

  const fetchVets = async () => {
    try {
      const response = await fetch("/api/vets");
      if (!response.ok) return;
      const data = await response.json();
      setVets(data.vets);
    } catch (error) {
      console.error("Failed to fetch vets:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update appointment");
      }
    } catch (error) {
      console.error("Failed to update appointment:", error);
      alert("Failed to update appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!appointment) return;
    if (!confirm("Cancel this appointment?")) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "CANCELED" }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      alert("Failed to cancel appointment");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment) return;
    if (!confirm("Permanently delete this appointment? This cannot be undone.")) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to delete appointment");
      }
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      alert("Failed to delete appointment");
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Pet Info (Read-only) */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Pet</p>
            <p className="text-lg font-semibold text-slate-900">
              {appointment.pet.name} ({appointment.pet.species})
            </p>
            <p className="text-sm text-slate-600">
              Owner: {appointment.pet.owner.name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label>Time *</Label>
                <Select
                  required
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                >
                  <option value="">Select time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Vet */}
            <div className="space-y-2">
              <Label>Assign Vet *</Label>
              <Select
                required
                value={formData.vetId}
                onChange={(e) =>
                  setFormData({ ...formData, vetId: e.target.value })
                }
              >
                <option value="">Select vet</option>
                {vets.map((vet) => (
                  <option key={vet.id} value={vet.id}>
                    Dr {vet.firstName} {vet.lastName}
                  </option>
                ))}
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason for Visit *</Label>
              <Input
                placeholder="e.g., Vaccination, Checkup, Ear Infection"
                required
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "CONFIRMED" | "CANCELED" | "COMPLETED",
                  })
                }
              >
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELED">Canceled</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-between">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading || formData.status === "CANCELED"}
                >
                  Cancel Appointment
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#C00000] hover:bg-[#A00000]"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}