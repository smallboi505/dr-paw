"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Camera } from "lucide-react";
import { getPermissions, type UserRole } from "@/lib/permissions";

export default function GeneralSettings() {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  const [clinicInfo, setClinicInfo] = useState({
    name: "",
    location: "",
    phone: "",
    timezone: "",
    petIdMode: "",
    petIdFormat: "",
  });

  const [workingHours, setWorkingHours] = useState([
    { day: "Monday", open: "09:00", close: "16:30" },
    { day: "Tuesday", open: "09:00", close: "16:30" },
    { day: "Wednesday", open: "09:00", close: "16:30" },
    { day: "Thursday", open: "09:00", close: "16:30" },
    { day: "Friday", open: "09:00", close: "16:30" },
  ]);

  // Fetch user role
  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => res.json())
      .then((data) => setUserRole(data.role as UserRole))
      .catch(() => {});
  }, []);

  const permissions = userRole ? getPermissions(userRole) : null;

  // Fetch clinic data on mount
  useEffect(() => {
    fetchClinicData();
  }, []);

  const fetchClinicData = async () => {
    try {
      const response = await fetch("/api/clinic");
      if (response.ok) {
        const data = await response.json();
        setClinicInfo({
          name: data.name || "",
          location: data.location || "",
          phone: data.phone || "",
          timezone: data.timezone || "",
          petIdMode: data.petIdMode || "MANUAL",
          petIdFormat: data.petIdFormat || "PET####",
        });
      }
    } catch (error) {
      console.error("Failed to fetch clinic data:", error);
    } finally {
      setFetchingData(false);
    }
  };

  const timeSlots = generateTimeSlots();

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicInfo),
      });

      if (response.ok) {
        setEditing(false);
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Clinic Information */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Clinic Information
        </h2>

        <div className="border border-slate-200 rounded-lg p-6">
          <div className="flex gap-6">
            {/* Logo Upload */}
            <div className="flex-shrink-0">
              <div className="w-40 h-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center border-2 border-purple-200">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Clinic Logo</p>
                </div>
              </div>
            </div>

            {/* Clinic Details */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clinic Name:</Label>
                  <Input
                    value={clinicInfo.name}
                    onChange={(e) =>
                      setClinicInfo({ ...clinicInfo, name: e.target.value })
                    }
                    disabled={!editing}
                    className={!editing ? "bg-slate-50" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location:</Label>
                  <Input
                    value={clinicInfo.location}
                    onChange={(e) =>
                      setClinicInfo({ ...clinicInfo, location: e.target.value })
                    }
                    disabled={!editing}
                    className={!editing ? "bg-slate-50" : ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone:</Label>
                  <Input
                    value={clinicInfo.phone}
                    onChange={(e) =>
                      setClinicInfo({ ...clinicInfo, phone: e.target.value })
                    }
                    disabled={!editing}
                    className={!editing ? "bg-slate-50" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time Zone:</Label>
                  <Input
                    value={clinicInfo.timezone}
                    onChange={(e) =>
                      setClinicInfo({ ...clinicInfo, timezone: e.target.value })
                    }
                    disabled={!editing}
                    className={!editing ? "bg-slate-50" : ""}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <h3 className="font-semibold text-slate-900 mb-4">Pet ID Settings</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pet ID Mode:</Label>
                    <Select
                      value={clinicInfo.petIdMode}
                      onChange={(e) =>
                        setClinicInfo({ ...clinicInfo, petIdMode: e.target.value })
                      }
                      disabled={!editing}
                      className={!editing ? "bg-slate-50" : ""}
                    >
                      <option value="MANUAL">Manual Entry</option>
                      <option value="AUTO">Auto-Generate</option>
                    </Select>
                    <p className="text-xs text-slate-500">
                      {clinicInfo.petIdMode === "AUTO" 
                        ? "IDs will be automatically generated" 
                        : "You'll enter IDs manually"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Pet ID Format:</Label>
                    <Input
                      value={clinicInfo.petIdFormat}
                      onChange={(e) =>
                        setClinicInfo({ ...clinicInfo, petIdFormat: e.target.value })
                      }
                      disabled={!editing}
                      className={`font-mono ${!editing ? "bg-slate-50" : ""}`}
                      placeholder="e.g., MS/VC/####"
                    />
                    <p className="text-xs text-slate-500">
                      Use # for numbers. Example: MS/VC/#### becomes MS/VC/0001
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                {permissions?.canEditClinicSettings && (
                  <>
                    {!editing ? (
                      <Button
                        onClick={() => setEditing(true)}
                        className="bg-[#C00000] hover:bg-[#A00000]"
                      >
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-[#C00000] hover:bg-[#A00000]"
                    >
                      {loading ? "Saving..." : "Save"}
                    </Button>
                  </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Working Hours
        </h2>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-pink-100 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                  Days
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                  Open
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
                  Close
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {workingHours.map((schedule, index) => (
                <tr key={schedule.day} className="border-b border-slate-100">
                  <td className="py-3 px-4 text-sm text-slate-900">
                    {schedule.day}
                  </td>
                  <td className="py-3 px-4">
                    <Select
                      value={schedule.open}
                      onChange={(e) => {
                        const newHours = [...workingHours];
                        newHours[index].open = e.target.value;
                        setWorkingHours(newHours);
                      }}
                      disabled={!editing}
                      className={`w-32 ${!editing ? "bg-slate-50" : ""}`}
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {formatTime(slot)}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-3 px-4">
                    <Select
                      value={schedule.close}
                      onChange={(e) => {
                        const newHours = [...workingHours];
                        newHours[index].close = e.target.value;
                        setWorkingHours(newHours);
                      }}
                      disabled={!editing}
                      className={`w-32 ${!editing ? "bg-slate-50" : ""}`}
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {formatTime(slot)}
                        </option>
                      ))}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate time slots
function generateTimeSlots() {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
}

// Helper function to format time display
function formatTime(time: string) {
  const [hour, minute] = time.split(":");
  const h = parseInt(hour);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayHour}:${minute} ${period}`;
}