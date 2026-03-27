"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown } from "lucide-react";

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/clinics").then(res => res.json()),
      fetch("/api/user/profile").then(res => res.json()),
    ]).then(([clinicsData, profileData]) => {
      setClinics(clinicsData.clinics || []);
      setCurrentClinicId(profileData.clinicId);
    }).catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSwitch = async (clinicId: string) => {
    if (clinicId === currentClinicId || switching) return;
    setSwitching(true);
    setShowDropdown(false);
    try {
      const res = await fetch("/api/user/select-clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      });
      if (res.ok) {
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

  return (
    <div className="relative" ref={ref}>
      {/* Icon-only trigger button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={switching}
        title="Switch Clinic"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 group"
      >
        <Building2 className="h-5 w-5 text-slate-600" />
        {/* Tooltip */}
        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Switch Clinic
        </span>
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your Clinics</p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {clinics.length === 0 ? (
              <p className="px-3 py-4 text-sm text-slate-500 text-center">No clinics found</p>
            ) : clinics.map((clinic) => (
              <button
                key={clinic.clinicId}
                onClick={() => handleSwitch(clinic.clinicId)}
                disabled={switching}
                className={`w-full px-3 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left disabled:opacity-50 ${
                  clinic.clinicId === currentClinicId ? "bg-purple-50" : ""
                }`}
              >
                <div className="w-9 h-9 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center text-lg border border-red-200 flex-shrink-0">
                  🏥
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate text-sm">{clinic.clinicName}</p>
                  <p className="text-xs text-slate-500 truncate">{clinic.location || "No location"}</p>
                </div>
                {clinic.clinicId === currentClinicId && (
                  <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-slate-100">
            <button
              onClick={() => { setShowDropdown(false); router.push("/select-clinic"); }}
              className="w-full text-left text-sm text-[#C00000] hover:underline font-medium"
            >
              + Create or Join Another Clinic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}