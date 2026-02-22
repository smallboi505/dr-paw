"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface NewVisitDialogProps {
  open: boolean;
  petId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Vet {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export default function NewVisitDialog({
  open,
  petId,
  onClose,
  onSuccess,
}: NewVisitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [vets, setVets] = useState<Vet[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0], // Today's date
    history: "",
    diagnosis: "",
    treatment: "",
    vetId: "",
  });

  useEffect(() => {
    if (open) {
      fetchVets();
    }
  }, [open]);

  const fetchVets = async () => {
    try {
      const response = await fetch("/api/vets");
      if (response.ok) {
        const data = await response.json();
        setVets(data.vets);
      }
    } catch (error) {
      console.error("Failed to fetch vets:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/pets/${petId}/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        // Reset form
        setFormData({
          date: new Date().toISOString().split("T")[0],
          history: "",
          diagnosis: "",
          treatment: "",
          vetId: "",
        });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create visit");
      }
    } catch (error) {
      console.error("Failed to create visit:", error);
      alert("Failed to create visit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New Visit</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label>Visit Date *</Label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-2 text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C00000] focus:border-transparent"
                style={{ colorScheme: 'light' }}
              />
            </div>

            {/* Vet Selection */}
            <div className="space-y-2">
              <Label>Attending Vet *</Label>
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

            {/* Clinical History & Vitals */}
            <div className="space-y-2">
              <Label>Clinical History & Vitals *</Label>
              <textarea
                required
                value={formData.history}
                onChange={(e) =>
                  setFormData({ ...formData, history: e.target.value })
                }
                placeholder="e.g., Temp = 38.2°C | Presented dull and lethargic. Loss appetite for 2 days. Visible worms on skin."
                className="w-full h-28 px-4 py-3 text-slate-900 placeholder:text-slate-600 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C00000] focus:border-transparent"
              />
              <p className="text-xs text-slate-600">
                Include temperature, symptoms, and physical examination findings
              </p>
            </div>

            {/* Diagnosis */}
            <div className="space-y-2">
              <Label>Diagnosis *</Label>
              <textarea
                required
                value={formData.diagnosis}
                onChange={(e) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                placeholder="e.g., Endoparasitism"
                className="w-full h-24 px-4 py-3 text-slate-900 placeholder:text-slate-600 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C00000] focus:border-transparent"
              />
            </div>

            {/* Treatment */}
            <div className="space-y-2">
              <Label>Treatment *</Label>
              <textarea
                required
                value={formData.treatment}
                onChange={(e) =>
                  setFormData({ ...formData, treatment: e.target.value })
                }
                placeholder="e.g., Prazivet 0.5 ml, Multivitamin 3ml"
                className="w-full h-24 px-4 py-3 text-slate-900 placeholder:text-slate-600 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C00000] focus:border-transparent"
              />
              <p className="text-xs text-slate-600">
                Include medications, dosages, and instructions
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4">
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
                disabled={loading}
                className="bg-[#C00000] hover:bg-[#A00000]"
              >
                {loading ? "Saving..." : "Save Visit"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}