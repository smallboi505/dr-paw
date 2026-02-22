"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface EditVisitDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  visit: {
    id: string;
    date: string;
    history: string | null;
    diagnosis: string | null;
    treatment: string | null;
    notes: string | null;
  };
}

export default function EditVisitDialog({ open, onClose, onSuccess, visit }: EditVisitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    history: "",
    diagnosis: "",
    treatment: "",
  });

  useEffect(() => {
    if (visit && open) {
      // Format date for input (YYYY-MM-DD)
      const dateObj = new Date(visit.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      
      setFormData({
        date: formattedDate,
        history: visit.history || "",
        diagnosis: visit.diagnosis || "",
        treatment: visit.treatment || "",
      });
    }
  }, [visit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/visits/${visit.id}`, {
        method: "PUT",
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
        alert(error.error || "Failed to update visit");
      }
    } catch (error) {
      console.error("Failed to update visit:", error);
      alert("Failed to update visit");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/visits/${visit.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Visit deleted successfully");
        setShowDeleteConfirm(false);
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete visit");
      }
    } catch (error) {
      console.error("Failed to delete visit:", error);
      alert("Failed to delete visit");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Visit - {formatDate(visit.date)}</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label>Visit Date *</Label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            {/* History */}
            <div className="space-y-2">
              <Label>History</Label>
              <Textarea
                value={formData.history}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, history: e.target.value })
                }
                placeholder="Medical history and presenting complaints..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Diagnosis */}
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea
                value={formData.diagnosis}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, diagnosis: e.target.value })
                }
                placeholder="Clinical diagnosis..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Treatment */}
            <div className="space-y-2">
              <Label>Treatment</Label>
              <Textarea
                value={formData.treatment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, treatment: e.target.value })
                }
                placeholder="Treatment plan and medications..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || deleting}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                {deleting ? "Deleting..." : "Delete Visit"}
              </Button>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading || deleting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || deleting}
                  className="bg-[#C00000] hover:bg-[#A00000]"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Visit"
        message={`Are you sure you want to delete this visit from ${formatDate(visit.date)}? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </Dialog>
  );
}