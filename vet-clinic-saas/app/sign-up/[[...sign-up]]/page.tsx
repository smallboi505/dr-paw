"use client";

import { useState, Suspense } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

function SignUpContent() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  const redirectUrl = searchParams.get("redirect_url") || "";
  const isInviteSignup = redirectUrl.includes("accept-invite");

  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    if (!formData.email.trim()) { setError("Please enter your email address"); return; }
    if (formData.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    try {
      await signUp.create({ emailAddress: formData.email, password: formData.password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err: any) {
      const clerkError = err.errors?.[0];
      setError(clerkError?.longMessage || clerkError?.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push(isInviteSignup && redirectUrl ? redirectUrl : "/onboarding");
      } else {
        setError("Verification failed. Please try again.");
      }
    } catch (err: any) {
      const clerkError = err.errors?.[0];
      setError(clerkError?.longMessage || clerkError?.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    setGoogleLoading(true);
    setError("");
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/onboarding",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || "Failed to sign up with Google");
      setGoogleLoading(false);
    }
  };

  const pageShell = (content: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#C00000] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dr. Paw</h1>
          <p className="text-slate-600">Veterinary Clinic Management</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">{content}</div>
        <div className="text-center mt-6 text-sm text-slate-500">© 2026 Dr. Paw. All rights reserved.</div>
      </div>
    </div>
  );

  if (verifying) {
    return pageShell(
      <>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
        <p className="text-slate-600 mb-6">We sent a verification code to <strong>{formData.email}</strong></p>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{error}</p></div>}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-slate-700 font-semibold">Verification Code</Label>
            <Input id="code" type="text" placeholder="Enter 6-digit code" value={code} onChange={(e) => setCode(e.target.value)} required className="text-slate-900 h-12 text-center text-2xl tracking-widest" maxLength={6} />
          </div>
          <Button type="submit" disabled={loading || code.length !== 6} className="w-full h-12 bg-[#C00000] hover:bg-[#A00000] text-white text-lg font-semibold">
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setVerifying(false)} className="text-sm text-[#C00000] hover:underline">← Back to sign up</button>
        </div>
      </>
    );
  }

  return pageShell(
    <>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Your Account</h2>
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{error}</p></div>}

      {isInviteSignup && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900"><strong>📧 Joining existing clinic</strong><br/>You're creating an account to join an existing clinic.</p>
        </div>
      )}

      {/* Google Sign Up */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignUp}
        disabled={googleLoading}
        className="w-full h-12 mb-4 border-slate-300 text-slate-700 font-semibold flex items-center justify-center gap-3 hover:bg-slate-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {googleLoading ? "Redirecting..." : "Continue with Google"}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-sm text-slate-400">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center gap-2"><Mail className="h-4 w-4" />Email Address</Label>
          <Input id="email" type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="text-slate-900 h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-2"><Lock className="h-4 w-4" />Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required className="text-slate-900 h-12 pr-12" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-xs text-slate-500">Must be at least 8 characters</p>
        </div>
        <Button type="submit" disabled={loading || !isLoaded} className="w-full h-12 bg-[#C00000] hover:bg-[#A00000] text-white text-lg font-semibold">
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-slate-600">Already have an account?{" "}
          <Link href="/sign-in" className="text-[#C00000] hover:underline font-semibold">Sign In</Link>
        </p>
      </div>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center"><div className="text-slate-600">Loading...</div></div>}>
      <SignUpContent />
    </Suspense>
  );
}