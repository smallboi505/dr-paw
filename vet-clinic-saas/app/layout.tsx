import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import { MobileMenuProvider } from "@/lib/mobile-menu-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dr. Paw - Veterinary Clinic Management",
  description: "Dr. Paw helps veterinary clinics go paperless. Manage pets, owners, appointments, medical records, and staff — all in one place.",
  keywords: ["veterinary clinic software", "vet management system", "pet records", "veterinary SaaS", "clinic management"],
  authors: [{ name: "Dr. Paw" }],
  creator: "Dr. Paw",
  metadataBase: new URL("https://drpawgh.com"),
  openGraph: {
    type: "website",
    url: "https://drpawgh.com",
    title: "Dr. Paw - Veterinary Clinic Management",
    description: "Dr. Paw helps veterinary clinics go paperless. Manage pets, owners, appointments, medical records, and staff — all in one place.",
    siteName: "Dr. Paw",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dr. Paw - Veterinary Clinic Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dr. Paw - Veterinary Clinic Management",
    description: "Dr. Paw helps veterinary clinics go paperless. Manage pets, owners, appointments, medical records, and staff — all in one place.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <MobileMenuProvider>
            {children}
          </MobileMenuProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}