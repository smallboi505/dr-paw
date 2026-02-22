import { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar - Hidden on mobile, fixed on desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="lg:ml-64">
        {/* Header - Full width on mobile, offset on desktop */}
        <Header />

        {/* Page Content - Responsive padding */}
        <main className="pt-16 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}