"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Phone, Globe } from "lucide-react";
import { completeOnboarding } from "@/app/actions/onboarding";
import { getFormatPreview } from "@/lib/pet-id";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [petIdMode, setPetIdMode] = useState<"MANUAL" | "AUTO">("AUTO");
  const [petIdFormat, setPetIdFormat] = useState("PET####");

  // Pre-fill clinic name from Clerk's username field
  const defaultClinicName = user?.username || "";

  const previewIds = petIdFormat ? getFormatPreview(petIdFormat) : [];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout - please try again")), 30000)
      );
      
      const result = await Promise.race([
        completeOnboarding(formData),
        timeoutPromise
      ]) as any;

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.success && result?.redirectTo) {
        // Redirect to dashboard - will check onboarding status there
        window.location.href = result.redirectTo;
      } else {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Onboarding error:", err);
      setError(err?.message || "Failed to complete onboarding");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Emergency Sign Out Button */}
        <div className="text-right mb-4">
          <button
            onClick={() => signOut()}
            className="text-sm text-slate-600 hover:text-slate-900 underline"
          >
            Sign out
          </button>
        </div>
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-16 h-16 bg-[#C00000] rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🐾</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome to Dr. Paw!</h1>
          <p className="text-slate-600">Let's set up your veterinary clinic</p>
        </div>

        {/* Onboarding Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Clinic Name (Pre-filled from Clerk) */}
            <div className="space-y-2">
              <Label htmlFor="clinicName" className="text-slate-700 font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Clinic Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clinicName"
                name="clinicName"
                type="text"
                placeholder="e.g., Marivet Veterinary Clinic"
                defaultValue={defaultClinicName}
                required
                className="text-slate-900 h-12"
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-slate-700 font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                name="location"
                type="text"
                placeholder="e.g., Accra, Ghana"
                required
                className="text-slate-900 h-12"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700 font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g., 0201234567"
                required
                className="text-slate-900 h-12"
              />
            </div>

            {/* Pet ID System */}
            <div className="space-y-4 col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 text-lg">Pet ID System</h3>
              
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">
                  Do you have an existing pet ID system? <span className="text-red-500">*</span>
                </Label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="petIdMode"
                      value="AUTO"
                      checked={petIdMode === "AUTO"}
                      onChange={(e) => setPetIdMode(e.target.value as "AUTO")}
                      className="w-4 h-4 text-[#C00000]"
                    />
                    <div>
                      <p className="font-medium text-slate-900">No - Auto-generate IDs for me</p>
                      <p className="text-sm text-slate-600">System will automatically create sequential pet IDs</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="petIdMode"
                      value="MANUAL"
                      checked={petIdMode === "MANUAL"}
                      onChange={(e) => setPetIdMode(e.target.value as "MANUAL")}
                      className="w-4 h-4 text-[#C00000]"
                    />
                    <div>
                      <p className="font-medium text-slate-900">Yes - I'll enter IDs manually</p>
                      <p className="text-sm text-slate-600">You have an existing system and want to continue using your IDs</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="petIdFormat" className="text-slate-700 font-semibold">
                  Pet ID Format <span className="text-red-500">*</span>
                </Label>
                <p className="text-sm text-slate-600 mb-2">
                  {petIdMode === "AUTO" 
                    ? "Enter your preferred format. We'll generate IDs automatically."
                    : "Enter your existing format. We'll validate IDs match this format."
                  }
                </p>
                <Input
                  id="petIdFormat"
                  name="petIdFormat"
                  type="text"
                  placeholder="e.g., MS/VC/####"
                  value={petIdFormat}
                  onChange={(e) => setPetIdFormat(e.target.value)}
                  required
                  className="text-slate-900 h-12 font-mono"
                />
                <p className="text-xs text-slate-500">
                  Use # for numbers. Examples: MS/VC/####, PET####, P-###
                </p>
                {previewIds.length > 0 && (
                  <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Preview:</p>
                    <div className="flex gap-3">
                      {previewIds.map((id, i) => (
                        <span key={i} className="font-mono text-sm font-semibold text-[#C00000]">
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-slate-700 font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Timezone
              </Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue="GMT"
                className="w-full h-12 px-3 rounded-md border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#C00000]"
              >
                <option value="GMT">GMT (Greenwich Mean Time)</option>
                <option value="WAT">WAT (West Africa Time)</option>
                <option value="EAT">EAT (East Africa Time)</option>
                <option value="CAT">CAT (Central Africa Time)</option>
                <option value="SAST">SAST (South Africa Time)</option>
              </select>
            </div>

            {/* Hidden field for email */}
            <input
              type="hidden"
              name="email"
              value={user?.primaryEmailAddress?.emailAddress || ""}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#C00000] hover:bg-[#A00000] text-white text-lg font-semibold"
            >
              {loading ? "Setting up your clinic..." : "Complete Setup"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-500">
          © 2026 Dr. Paw. All rights reserved.
        </div>
      </div>
    </div>
  );
}