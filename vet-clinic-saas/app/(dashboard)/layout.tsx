import { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TrialBanner from "@/components/layout/trial-banner";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <main className="pt-20">
          <TrialBanner />
          <div className="px-4 pb-4 lg:px-6 lg:pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}