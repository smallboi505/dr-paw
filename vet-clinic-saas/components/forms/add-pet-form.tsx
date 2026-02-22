"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Search, Plus, X } from "lucide-react";
import { validatePetIdFormat } from "@/lib/pet-id";

interface Owner {
  id: string;
  idNumber: string;
  name: string;
  phone: string;
  address?: string;
}

interface ClinicSettings {
  petIdMode: "MANUAL" | "AUTO";
  petIdFormat: string;
}

export function AddPetForm() {
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [baseIdNumber, setBaseIdNumber] = useState("");
  const [idValidationError, setIdValidationError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [showNewOwnerForm, setShowNewOwnerForm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pet form state
  const [petData, setPetData] = useState({
    name: "",
    species: "",
    breed: "",
    sex: "",
    color: "",
  });

  // New owner form state
  const [ownerData, setOwnerData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Fetch clinic settings on mount
  useEffect(() => {
    fetch("/api/clinic")
      .then(res => res.json())
      .then(data => {
        setClinicSettings({
          petIdMode: data.petIdMode || "MANUAL",
          petIdFormat: data.petIdFormat || "PET####",
        });
      })
      .catch(err => console.error("Failed to fetch clinic settings:", err));
  }, []);

  // Validate ID when it changes (only in MANUAL mode)
  useEffect(() => {
    if (clinicSettings?.petIdMode === "MANUAL" && baseIdNumber) {
      if (!validatePetIdFormat(baseIdNumber, clinicSettings.petIdFormat)) {
        setIdValidationError(`ID must match format: ${clinicSettings.petIdFormat}`);
      } else {
        setIdValidationError("");
      }
    } else {
      setIdValidationError("");
    }
  }, [baseIdNumber, clinicSettings]);

  const handleSearchOwner = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/owners/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.owners && data.owners.length > 0) {
        // Found owners - for now just select the first one
        setSelectedOwner(data.owners[0]);
        setBaseIdNumber(data.owners[0].idNumber);
      } else {
        // No owners found
        alert("No owner found. Please create a new owner.");
        setShowNewOwnerForm(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Failed to search for owner");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clinicSettings) {
      alert("Loading clinic settings...");
      return;
    }
    
    // Validate base ID (only for MANUAL mode)
    if (clinicSettings.petIdMode === "MANUAL") {
      if (!baseIdNumber.trim()) {
        alert("Please enter an ID number");
        return;
      }

      if (idValidationError) {
        alert(idValidationError);
        return;
      }
    }

    // Validate required fields
    if (!petData.name || !petData.species || !petData.sex) {
      alert("Please fill in all required pet fields (Name, Species, Sex)");
      return;
    }

    if (!selectedOwner && !showNewOwnerForm) {
      alert("Please select or create an owner");
      return;
    }

    if (showNewOwnerForm && (!ownerData.name || !ownerData.phone)) {
      alert("Please fill in required owner fields (Name, Phone)");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload
      const payload = {
        petData: {
          name: petData.name,
          species: petData.species,
          breed: petData.breed,
          sex: petData.sex,
          color: petData.color,
        },
        ownerData: showNewOwnerForm ? {
          idNumber: clinicSettings.petIdMode === "MANUAL" ? baseIdNumber : undefined,
          ...ownerData,
        } : null,
        ownerId: selectedOwner?.id || null,
        petIdNumber: clinicSettings.petIdMode === "MANUAL" ? baseIdNumber : undefined,
      };

      // Submit to API
      const response = await fetch("/api/pets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create pet");
      }

      alert(`Success! Pet registered with ID: ${result.pet.idNumber}`);
      
      // Reset form
      setBaseIdNumber("");
      setPetData({ name: "", species: "", breed: "", sex: "", color: "" });
      setOwnerData({ name: "", phone: "", address: "" });
      setSelectedOwner(null);
      setShowNewOwnerForm(false);

    } catch (error: any) {
      console.error("Submit error:", error);
      alert(error.message || "Failed to register pet");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!clinicSettings) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto p-6">
      {/* ID Number Section - Only show in MANUAL mode */}
      {clinicSettings.petIdMode === "MANUAL" && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">ID Number</h2>
          <div className="space-y-2">
            <Label htmlFor="base-id">
              Base ID Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="base-id"
              placeholder={`Format: ${clinicSettings.petIdFormat}`}
              value={baseIdNumber}
              onChange={(e) => setBaseIdNumber(e.target.value)}
              required
              disabled={!!selectedOwner}
              className={idValidationError ? "border-red-500" : ""}
            />
            {idValidationError && (
              <p className="text-sm text-red-600">{idValidationError}</p>
            )}
            <p className="text-sm text-slate-600">
              {baseIdNumber 
                ? `Owner will use ${baseIdNumber}. First pet will also use ${baseIdNumber}. Additional pets will use ${baseIdNumber}-2, ${baseIdNumber}-3, etc.`
                : "Owner will use this ID. First pet will also use this ID. Additional pets will use ID-2, ID-3, etc."
              }
            </p>
          </div>
        </div>
      )}

      {/* AUTO mode info */}
      {clinicSettings.petIdMode === "AUTO" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Auto-generation enabled:</strong> Pet IDs will be automatically generated using format: <span className="font-mono">{clinicSettings.petIdFormat}</span>
          </p>
        </div>
      )}

      {/* Owner Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Owner Information</h2>
        
        {!selectedOwner && !showNewOwnerForm && (
          <div className="space-y-4">
            <Label htmlFor="search-owner">Search Existing Owner</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search-owner"
                  placeholder="Search by name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                type="button" 
                onClick={handleSearchOwner}
                disabled={isSearching}
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewOwnerForm(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Owner
            </Button>
          </div>
        )}

        {selectedOwner && (
          <div className="bg-green-50 rounded-md p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-slate-900">{selectedOwner.name}</p>
                <p className="text-sm text-slate-600">{selectedOwner.phone}</p>
                <p className="text-sm text-slate-600">ID: {selectedOwner.idNumber}</p>
                {selectedOwner.address && (
                  <p className="text-sm text-slate-600">{selectedOwner.address}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedOwner(null);
                  setBaseIdNumber("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {showNewOwnerForm && !selectedOwner && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-slate-900">New Owner Details</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewOwnerForm(false);
                  setOwnerData({ name: "", phone: "", address: "" });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="owner-name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="owner-name"
                  placeholder="Enter owner's full name"
                  value={ownerData.name}
                  onChange={(e) => setOwnerData({ ...ownerData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="owner-phone"
                  type="tel"
                  placeholder="0XX XXX XXXX"
                  value={ownerData.phone}
                  onChange={(e) => setOwnerData({ ...ownerData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-address">Address</Label>
                <Input
                  id="owner-address"
                  placeholder="Enter address"
                  value={ownerData.address}
                  onChange={(e) => setOwnerData({ ...ownerData, address: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pet Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Pet Information</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="pet-name">
              Pet Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pet-name"
              placeholder="Enter pet's name"
              value={petData.name}
              onChange={(e) => setPetData({ ...petData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="species">
              Species <span className="text-red-500">*</span>
            </Label>
            <Select
              id="species"
              value={petData.species}
              onChange={(e) => setPetData({ ...petData, species: e.target.value })}
              required
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
            <Label htmlFor="breed">Breed</Label>
            <Input
              id="breed"
              placeholder="e.g., Maltese, Persian"
              value={petData.breed}
              onChange={(e) => setPetData({ ...petData, breed: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sex">
              Sex <span className="text-red-500">*</span>
            </Label>
            <Select
              id="sex"
              value={petData.sex}
              onChange={(e) => setPetData({ ...petData, sex: e.target.value })}
              required
            >
              <option value="">Select sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              placeholder="e.g., Brown, White"
              value={petData.color}
              onChange={(e) => setPetData({ ...petData, color: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || (clinicSettings.petIdMode === "MANUAL" && !!idValidationError)}
          className="bg-[#C00000] hover:bg-[#A00000]"
        >
          {isSubmitting ? "Registering..." : "Register Pet"}
        </Button>
      </div>
    </form>
  );
}