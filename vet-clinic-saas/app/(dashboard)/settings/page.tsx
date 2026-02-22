"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import GeneralSettings from "@/components/settings/general-settings";
import NotificationSettings from "@/components/settings/notification-settings";
import StaffSettings from "@/components/settings/staff-settings";

type Tab = "general" | "notifications" | "staff";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  const tabs = [
    { id: "general" as Tab, label: "General" },
    { id: "notifications" as Tab, label: "Notification" },
    { id: "staff" as Tab, label: "Staff" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        </div>

        {/* Content Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#C00000] text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg p-6">
            {activeTab === "general" && <GeneralSettings />}
            {activeTab === "notifications" && <NotificationSettings />}
            {activeTab === "staff" && <StaffSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}