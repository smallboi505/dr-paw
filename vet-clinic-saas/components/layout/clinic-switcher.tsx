"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Building2, Check } from "lucide-react";

interface Clinic {
  clinicId: string;
  clinicName: string;
  location: string | null;
  role: string;
}

export default function ClinicSwitcher() {
  const router = useRouter();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [currentClinicId, setCurrentClinicId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    // Fetch user's clinics and current clinic
    Promise.all([
      fetch("/api/user/clinics").then(res => res.json()),
      fetch("/api/user/profile").then(res => res.json())
    ])
      .then(([clinicsData, profileData]) => {
        console.log("Clinics data:", clinicsData);
        console.log("Profile data:", profileData);
        setClinics(clinicsData.clinics || []);
        setCurrentClinicId(profileData.clinicId);
      })
      .catch((err) => {
        console.error("Clinic switcher error:", err);
      });
  }, []);

  const handleSwitch = async (clinicId: string) => {
    if (clinicId === currentClinicId || switching) return;

    setSwitching(true);
    setShowDropdown(false);

    try {
      const response = await fetch("/api/user/select-clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      });

      if (response.ok) {
        // Refresh the page to load new clinic data
        window.location.href = "/";
      } else {
        alert("Failed to switch clinic");
        setSwitching(false);
      }
    } catch {
      alert("Failed to switch clinic");
      setSwitching(false);
    }
  };

  const currentClinic = clinics.find(c => c.clinicId === currentClinicId);

  // ALWAYS SHOW FOR TESTING - comment out this line later
  // if (clinics.length <= 1) return null;

  console.log("Rendering clinic switcher, clinics:", clinics.length);

  return (
    <div className="relative">
      {/* Current Clinic Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
      >
        <Building2 className="h-4 w-4 text-slate-600" />
        <div className="text-left hidden md:block">
          <p className="text-sm font-medium text-slate-900">
            {currentClinic?.clinicName || "Select Clinic"}
          </p>
          {currentClinic?.location && (
            <p className="text-xs text-slate-500">{currentClinic.location}</p>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Switch Clinic
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {clinics.map((clinic) => (
                <button
                  key={clinic.clinicId}
                  onClick={() => handleSwitch(clinic.clinicId)}
                  disabled={switching}
                  className={`w-full px-3 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors disabled:opacity-50 ${
                    clinic.clinicId === currentClinicId ? "bg-purple-50" : ""
                  }`}
                >
                  {/* Clinic Icon */}
                  <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center text-xl border border-red-200 flex-shrink-0">
                    🏥
                  </div>

                  {/* Clinic Info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {clinic.clinicName}
                    </p>
                    <p className="text-sm text-slate-600 truncate">
                      {clinic.location || "No location"}
                    </p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      clinic.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                      clinic.role === "VET" ? "bg-blue-100 text-blue-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {clinic.role === "ADMIN" ? "Administrator" :
                       clinic.role === "VET" ? "Veterinarian" :
                       clinic.role === "RECEPTION" ? "Receptionist" : clinic.role}
                    </span>
                  </div>

                  {/* Active Indicator */}
                  {clinic.clinicId === currentClinicId && (
                    <Check className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="px-3 py-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push("/select-clinic");
                }}
                className="w-full text-left text-sm text-[#C00000] hover:underline font-medium"
              >
                + Create or Join Another Clinic
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}