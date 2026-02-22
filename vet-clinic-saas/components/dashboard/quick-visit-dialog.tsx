"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, User } from "lucide-react";

interface QuickVisitDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Pet {
  id: string;
  idNumber: string;
  name: string;
  species: string;
  breed: string | null;
  owner: {
    name: string;
  };
}

export default function QuickVisitDialog({
  open,
  onClose,
}: QuickVisitDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "search">("choose");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Pet[]>([]);
  const [searching, setSearching] = useState(false);

  const handleNewPatient = () => {
    router.push("/pets/new");
    onClose();
  };

  const handleExistingPatient = () => {
    setStep("search");
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `/api/pets/search?query=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.pets || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handlePetSelect = (petId: string) => {
    router.push(`/pets/${petId}`);
    onClose();
    // Reset state
    setStep("choose");
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleBack = () => {
    setStep("choose");
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleBack();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Visit</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {step === "choose" && (
            <div className="space-y-4">
              <p className="text-slate-600 mb-6">
                Is this for a new patient or an existing patient?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleNewPatient}
                  className="p-6 border-2 border-slate-200 rounded-lg hover:border-[#C00000] hover:bg-red-50 transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="h-8 w-8 text-[#C00000]" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">New Patient</p>
                      <p className="text-sm text-slate-500">Register a new pet</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleExistingPatient}
                  className="p-6 border-2 border-slate-200 rounded-lg hover:border-[#C00000] hover:bg-red-50 transition-all group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User className="h-8 w-8 text-[#C00000]" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg">Existing Patient</p>
                      <p className="text-sm text-slate-500">Search for a pet</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === "search" && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  Search by pet name or ID number
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="e.g., Bingo or MS/VC/0003-1"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={searching}>
                    {searching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <p className="text-sm font-semibold text-slate-700">
                    Found {searchResults.length} pet(s)
                  </p>
                  {searchResults.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => handlePetSelect(pet.id)}
                      className="w-full p-4 border border-slate-200 rounded-lg hover:border-[#C00000] hover:bg-red-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {pet.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{pet.name}</p>
                          <p className="text-sm text-slate-600">
                            {pet.species}
                            {pet.breed && `, ${pet.breed}`} • {pet.idNumber}
                          </p>
                          <p className="text-sm text-slate-500">
                            Owner: {pet.owner.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !searching && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-500">No pets found</p>
                  <Button
                    variant="outline"
                    onClick={handleNewPatient}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Register New Pet
                  </Button>
                </div>
              )}

              {/* Back Button */}
              <div className="pt-4 border-t">
                <Button variant="outline" onClick={handleBack} className="w-full">
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}