"use client";

import { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";

interface UserClinicInfo {
  firstName: string | null;
  lastName: string | null;
  clinicName: string;
  role: string;
}

export default function UserProfileButton() {
  const { user } = useUser();
  const [info, setInfo] = useState<UserClinicInfo | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch user's clinic info
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => setInfo(data))
      .catch(() => {});
  }, [user]);

  // Format display name: "Abdul - Top Vet" or "Abdul Shakur - Top Vet"
  const getDisplayName = () => {
    if (!info) return null;
    
    const firstName = info.firstName || user?.firstName || "User";
    const clinicName = info.clinicName || "Clinic";
    
    return `${firstName} - ${clinicName}`;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Display Name */}
      {info && (
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-slate-900">
            {getDisplayName()}
          </p>
          <p className="text-xs text-slate-500">
            {info.role === "ADMIN" ? "Administrator" : 
             info.role === "VET" ? "Veterinarian" :
             info.role === "RECEPTION" ? "Receptionist" : "Staff"}
          </p>
        </div>
      )}

      {/* Clerk User Button */}
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-10 h-10",
            userButtonPopoverCard: "shadow-xl",
          },
        }}
        afterSignOutUrl="/sign-in"
      />
    </div>
  );
}