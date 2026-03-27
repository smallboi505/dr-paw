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
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => setInfo(data))
      .catch(() => {});
  }, [user]);

  const getDisplayName = () => {
    if (!info) return null;
    const firstName = info.firstName || user?.firstName || "User";
    const clinicName = info.clinicName || "Clinic";
    const truncatedClinic = clinicName.length > 15 ? clinicName.slice(0, 15) + "…" : clinicName;
    return `${firstName} - ${truncatedClinic}`;
  };

  const getRole = () => {
    if (!info) return null;
    switch (info.role) {
      case "ADMIN": return "Administrator";
      case "VET": return "Veterinarian";
      case "RECEPTION": return "Receptionist";
      default: return "Staff";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {info && (
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-slate-900 leading-tight">
            {getDisplayName()}
          </p>
          <p className="text-xs text-slate-500 leading-tight">
            {getRole()}
          </p>
        </div>
      )}
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-9 h-9",
            userButtonPopoverCard: "shadow-xl",
          },
        }}
        afterSignOutUrl="/sign-in"
      />
    </div>
  );
}