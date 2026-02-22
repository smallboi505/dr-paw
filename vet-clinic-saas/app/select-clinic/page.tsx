"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { MapPin, User, Plus, Loader2, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

interface ClinicMembership {
  clinicId: string;
  clinicName: string;
  location: string | null;
  role: string;
  joinedAt: string;
}

export default function SelectClinicPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { signOut } = useClerk();
  const [clinics, setClinics] = useState<ClinicMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Fetch all clinics this user belongs to
    fetch("/api/user/clinics")
      .then((res) => res.json())
      .then((data) => {
        const userClinics = data.clinics || [];

        if (userClinics.length === 0) {
          // No clinics → go to onboarding
          router.push("/onboarding");
        } else if (userClinics.length === 1) {
          // Only one clinic → go straight to dashboard
          handleSelectClinic(userClinics[0].clinicId);
        } else {
          // Multiple clinics → show selector
          setClinics(userClinics);
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [isLoaded, user]);

  const handleSelectClinic = async (clinicId: string) => {
    setSelecting(clinicId);
    try {
      // Set active clinic in session
      const res = await fetch("/api/user/select-clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        alert("Failed to select clinic");
        setSelecting(null);
      }
    } catch {
      alert("Failed to select clinic");
      setSelecting(null);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: "Administrator",
      VET: "Veterinarian",
      RECEPTION: "Receptionist",
      NURSE: "Nurse",
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-700 border border-purple-300",
      VET: "bg-blue-100 text-blue-700 border border-blue-300",
      RECEPTION: "bg-orange-100 text-orange-700 border border-orange-300",
      NURSE: "bg-green-100 text-green-700 border border-green-300",
    };
    return colors[role] || "bg-slate-100 text-slate-700";
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#C00000] mx-auto mb-4" />
          <p className="text-slate-600">Loading your clinics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#C00000] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back!</h1>
          <p className="text-slate-600 mt-2">
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </p>
          <p className="text-slate-500 text-sm mt-1">Select a clinic to continue</p>
        </div>

        {/* Clinic Cards */}
        <div className="space-y-4 mb-6">
          {clinics.map((clinic) => (
            <button
              key={clinic.clinicId}
              onClick={() => handleSelectClinic(clinic.clinicId)}
              disabled={selecting !== null}
              className="w-full bg-white rounded-2xl border border-slate-200 p-5 text-left hover:border-[#C00000] hover:shadow-lg transition-all duration-200 group disabled:opacity-60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Clinic Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center text-2xl border border-red-200">
                    🏥
                  </div>

                  {/* Clinic Info */}
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-[#C00000] transition-colors">
                      {clinic.clinicName}
                    </h3>
                    {clinic.location && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {clinic.location}
                      </p>
                    )}
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(clinic.role)}`}>
                        {getRoleLabel(clinic.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow / Loading */}
                <div className="text-slate-300 group-hover:text-[#C00000] transition-colors">
                  {selecting === clinic.clinicId ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Create New Clinic */}
        <button
          onClick={() => router.push("/onboarding")}
          disabled={selecting !== null}
          className="w-full bg-white rounded-2xl border-2 border-dashed border-slate-300 p-5 text-left hover:border-[#C00000] hover:bg-red-50 transition-all duration-200 group disabled:opacity-60"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <Plus className="h-6 w-6 text-slate-400 group-hover:text-[#C00000] transition-colors" />
            </div>
            <div>
              <h3 className="font-bold text-slate-600 group-hover:text-[#C00000] transition-colors">
                Create a New Clinic
              </h3>
              <p className="text-sm text-slate-400">Set up your own Dr. Paw workspace</p>
            </div>
          </div>
        </button>

        {/* Sign Out */}
        <div className="text-center mt-6">
          <button
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mx-auto"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

      </div>
    </div>
  );
}