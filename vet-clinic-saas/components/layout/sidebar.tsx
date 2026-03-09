"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  PawPrint, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  X
} from "lucide-react";
import { useMobileMenu } from "@/lib/mobile-menu-context";

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { isOpen, closeMenu } = useMobileMenu();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/pets", icon: PawPrint, label: "Pets" },
    { href: "/owners", icon: Users, label: "Owners" },
    { href: "/appointments", icon: Calendar, label: "Appointments" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-screen w-64 bg-[#C00000] z-30">
        <SidebarContent 
          navItems={navItems} 
          isActive={isActive} 
          signOut={signOut}
          onLinkClick={() => {}}
        />
      </div>

      {/* MOBILE SIDEBAR */}
      {isOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fadeIn"
            onClick={closeMenu}
          />
          <div className="lg:hidden fixed left-0 top-0 h-screen w-64 bg-[#C00000] z-50 shadow-2xl animate-slideInLeft flex flex-col">
            <button
              onClick={closeMenu}
              className="absolute top-4 right-4 p-2 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <SidebarContent 
              navItems={navItems} 
              isActive={isActive} 
              signOut={signOut}
              onLinkClick={closeMenu}
            />
          </div>
        </>
      )}
    </>
  );
}

function SidebarContent({ 
  navItems, 
  isActive, 
  signOut,
  onLinkClick 
}: { 
  navItems: any[];
  isActive: (href: string) => boolean;
  signOut: any;
  onLinkClick: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-red-700 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 text-white" onClick={onLinkClick}>
          <span className="text-2xl font-bold">Dr. P</span>
          <span className="text-2xl">🐾</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="py-4 flex-shrink-0">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={`flex items-center gap-3 px-6 py-3 text-white transition-colors ${
              isActive(item.href)
                ? "bg-red-700 border-l-4 border-white"
                : "hover:bg-red-700"
            }`}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Logout Button */}
      <div className="px-4 py-5 border-t border-red-700 flex-shrink-0">
        <button 
          onClick={() => {
            onLinkClick();
            signOut({ redirectUrl: "/sign-in" });
          }}
          className="flex items-center gap-3 px-4 py-3 text-white hover:bg-red-700 rounded-lg transition-colors w-full"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">LOGOUT</span>
        </button>
      </div>
    </div>
  );
}