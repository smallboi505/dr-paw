import { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <main className="pt-20 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}