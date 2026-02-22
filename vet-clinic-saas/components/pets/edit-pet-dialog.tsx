"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface EditPetDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pet: {
    id: string;
    idNumber: string;
    name: string;
    species: string;
    breed: string | null;
    sex: string;
    color: string | null;
    status: string;
  };
}

export default function EditPetDialog({ open, onClose, onSuccess, pet }: EditPetDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    breed: "",
    sex: "",
    color: "",
    status: "",
  });

  useEffect(() => {
    if (pet && open) {
      setFormData({
        name: pet.name,
        species: pet.species,
        breed: pet.breed || "",
        sex: pet.sex,
        color: pet.color || "",
        status: pet.status,
      });
    }
  }, [pet, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/pets/${pet.id}`, {
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
        alert(error.error || "Failed to update pet");
      }
    } catch (error) {
      console.error("Failed to update pet:", error);
      alert("Failed to update pet");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/pets/${pet.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Pet deleted successfully");
        setShowDeleteConfirm(false);
        onSuccess();
        onClose();
        // Redirect to pets list
        window.location.href = "/pets";
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete pet");
      }
    } catch (error) {
      console.error("Failed to delete pet:", error);
      alert("Failed to delete pet");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Pet - {pet.idNumber}</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label>Pet Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Buddy"
              />
            </div>

            {/* Species and Breed */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Species *</Label>
                <Select
                  required
                  value={formData.species}
                  onChange={(e) =>
                    setFormData({ ...formData, species: e.target.value })
                  }
                >
                  <option value="">Select species</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Bird">Bird</option>
                  <option value="Rabbit">Rabbit</option>
                  <option value="Other">Other</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Breed</Label>
                <Input
                  value={formData.breed}
                  onChange={(e) =>
                    setFormData({ ...formData, breed: e.target.value })
                  }
                  placeholder="Golden Retriever"
                />
              </div>
            </div>

            {/* Sex and Color */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sex *</Label>
                <Select
                  required
                  value={formData.sex}
                  onChange={(e) =>
                    setFormData({ ...formData, sex: e.target.value })
                  }
                >
                  <option value="">Select sex</option>
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="Golden"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                required
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="DECEASED">Deceased</option>
                <option value="TRANSFERRED">Transferred</option>
              </Select>
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
                {deleting ? "Deleting..." : "Delete Pet"}
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
        title="Delete Pet"
        message={`Are you sure you want to delete ${pet.name}? This will also delete all visits, notes, and appointments. This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </Dialog>
  );
}