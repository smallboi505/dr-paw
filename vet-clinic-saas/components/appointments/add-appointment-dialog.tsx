"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  owner: {
    name: string;
  };
}

interface Vet {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface AddAppointmentDialogProps {
  open: boolean;
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

export default function AddAppointmentDialog({
  open,
  onClose,
  onSuccess,
}: AddAppointmentDialogProps) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPet, setSearchPet] = useState("");

  const [formData, setFormData] = useState({
    petId: "",
    vetId: "",
    date: "",
    time: "",
    reason: "",
  });

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (open) {
      fetchVets();
    }
  }, [open]);

  const fetchVets = async () => {
    try {
      console.log("📞 Calling /api/vets...");
      const response = await fetch("/api/vets");
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        console.error("❌ Bad response:", response.status, response.statusText);
        const text = await response.text();
        console.error("Response body:", text);
        return;
      }
      
      const data = await response.json();
      console.log("✅ Vets received:", data.vets);
      setVets(data.vets);
    } catch (error) {
      console.error("❌ Failed to fetch vets:", error);
    }
  };

  const fetchPets = async (search: string) => {
    if (search.length < 2) {
      setPets([]);
      return;
    }

    try {
      const response = await fetch(`/api/pets/search?query=${search}`);
      const data = await response.json();
      setPets(data.pets);
    } catch (error) {
      console.error("Failed to fetch pets:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPets(searchPet);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchPet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/appointments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          petId: "",
          vetId: "",
          date: "",
          time: "",
          reason: "",
        });
        setSearchPet("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create appointment");
      }
    } catch (error) {
      console.error("Failed to create appointment:", error);
      alert("Failed to create appointment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Schedule New Appointment</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Search Pet */}
            <div className="space-y-2 relative">
              <Label>Search Pet</Label>
              <Input
                placeholder="Type pet name or owner name..."
                value={searchPet}
                onChange={(e) => setSearchPet(e.target.value)}
                autoComplete="off"
              />
              {pets.length > 0 && (
                <div className="absolute z-50 w-full border border-slate-200 rounded-lg max-h-60 overflow-y-auto bg-white shadow-lg mt-1">
                  {pets.map((pet) => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, petId: pet.id });
                        setSearchPet(
                          `${pet.name} (${pet.species}) - Owner: ${pet.owner.name}`
                        );
                        setPets([]);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {pet.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {pet.species}, {pet.breed || "Mixed"} - Owner:{" "}
                        {pet.owner.name}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

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

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.petId}
              className="bg-[#C00000] hover:bg-[#A00000]"
            >
              {loading ? "Scheduling..." : "Schedule Appointment"}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}