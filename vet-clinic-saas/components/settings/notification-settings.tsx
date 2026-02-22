"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function NotificationSettings() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    appointmentConfirmations: true,
    newPetRegistration: true,
    staffUpdates: false,
    systemAlerts: true,
    marketingEmails: false,
  });

  // Fetch current preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/notification-preferences");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.preferences);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Notification settings saved successfully!");
      } else {
        alert("Failed to save notification settings");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save notification settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
        <p className="text-slate-600 mt-1">
          Configure how you want to receive notifications
        </p>
      </div>

      {/* Email & SMS */}
      <div className="border border-slate-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Communication Channels
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <Label className="text-base font-medium text-slate-900">
                Email Notifications
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Receive notifications via email
              </p>
            </div>
            <button
              onClick={() => handleToggle("emailNotifications")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailNotifications ? "bg-[#C00000]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <Label className="text-base font-medium text-slate-900">
                SMS Notifications
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Receive notifications via text message
              </p>
            </div>
            <button
              onClick={() => handleToggle("smsNotifications")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.smsNotifications ? "bg-[#C00000]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.smsNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Notifications */}
      <div className="border border-slate-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Appointment Notifications
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <Label className="text-base font-medium text-slate-900">
                Appointment Reminders
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Send reminders 24 hours before appointments
              </p>
            </div>
            <button
              onClick={() => handleToggle("appointmentReminders")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.appointmentReminders ? "bg-[#C00000]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.appointmentReminders ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <Label className="text-base font-medium text-slate-900">
                Appointment Confirmations
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Send confirmation when appointments are booked
              </p>
            </div>
            <button
              onClick={() => handleToggle("appointmentConfirmations")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.appointmentConfirmations ? "bg-[#C00000]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.appointmentConfirmations ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* System Notifications */}
      <div className="border border-slate-200 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          System Notifications
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <Label className="text-base font-medium text-slate-900">
                New Pet Registration
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Notify when a new pet is registered
              </p>
            </div>
            <button
              onClick={() => handleToggle("newPetRegistration")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.newPetRegistration ? "bg-[#C00000]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.newPetRegistration ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <Label className="text-base font-medium text-slate-900">
                Staff Updates
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Notify when staff members are added or updated
              </p>
            </div>
            <button
              onClick={() => handleToggle("staffUpdates")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.staffUpdates ? "bg-[#C00000]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.staffUpdates ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <Label className="text-base font-medium text-slate-900">
                System Alerts
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Important system messages and updates
              </p>
            </div>
            <button
              onClick={() => handleToggle("systemAlerts")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.systemAlerts ? "bg-[#C00000]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.systemAlerts ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <Label className="text-base font-medium text-slate-900">
                Marketing Emails
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                Receive tips, updates, and promotional content
              </p>
            </div>
            <button
              onClick={() => handleToggle("marketingEmails")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.marketingEmails ? "bg-[#C00000]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.marketingEmails ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-[#C00000] hover:bg-[#A00000]"
        >
          {loading ? "Saving..." : "Save Notification Settings"}
        </Button>
      </div>
    </div>
  );
}