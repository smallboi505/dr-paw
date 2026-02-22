"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface EditOwnerDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  owner: {
    id: string;
    idNumber: string;
    name: string;
    phone: string;
    address: string | null;
    _count?: {
      pets: number;
    };
  };
}

export default function EditOwnerDialog({ open, onClose, onSuccess, owner }: EditOwnerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (owner && open) {
      setFormData({
        name: owner.name,
        phone: owner.phone,
        address: owner.address || "",
      });
    }
  }, [owner, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/owners/${owner.id}`, {
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
        alert(error.error || "Failed to update owner");
      }
    } catch (error) {
      console.error("Failed to update owner:", error);
      alert("Failed to update owner");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/owners/${owner.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Owner and all their pets deleted successfully");
        setShowDeleteConfirm(false);
        onSuccess();
        onClose();
        // Redirect to owners list
        window.location.href = "/owners";
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete owner");
      }
    } catch (error) {
      console.error("Failed to delete owner:", error);
      alert("Failed to delete owner");
    } finally {
      setDeleting(false);
    }
  };

  const petCount = owner._count?.pets || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Owner - {owner.idNumber}</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label>Owner Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="0201234567"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Accra, Ghana"
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
                {deleting ? "Deleting..." : "Delete Owner"}
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
        title="Delete Owner"
        message={`Are you sure you want to delete ${owner.name}? This will also delete ALL ${petCount} pet${petCount !== 1 ? 's' : ''} they own, along with all visits, notes, and appointments. This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </Dialog>
  );
}