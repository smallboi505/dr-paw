"use client";

import { useState, Suspense } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

function SignInContent() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"password" | "code">("password");
  const [code, setCode] = useState("");

  const redirectUrl = searchParams.get("redirect_url") || "";

  const [formData, setFormData] = useState({ email: "", password: "" });

  const completeSignIn = async (sessionId: string | null) => {
    await setActive!({ session: sessionId });
    router.push("/select-clinic");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({
        identifier: formData.email,
        password: formData.password,
      });
      if (result.status === "complete") {
        await completeSignIn(result.createdSessionId);
      } else if (result.status === "needs_second_factor") {
        await signIn.prepareSecondFactor({ strategy: "email_code" });
        setStep("code");
      } else if (result.status === "needs_first_factor") {
        await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId: result.identifier! });
        setStep("code");
      } else {
        setError("Unexpected status: " + result.status);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError("");
    try {
      let result;
      try {
        result = await signIn.attemptSecondFactor({ strategy: "email_code", code });
      } catch {
        result = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      }
      if (result.status === "complete") {
        await completeSignIn(result.createdSessionId);
      } else {
        setError("Verification failed: " + result.status);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  if (step === "code") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#C00000] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🐾</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Dr. Paw</h1>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h2>
            <p className="text-slate-600 mb-6">We sent a verification code to <strong>{formData.email}</strong></p>
            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{error}</p></div>}
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-700 font-semibold">Verification Code</Label>
                <Input id="code" type="text" placeholder="Enter 6-digit code" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={6} className="text-slate-900 h-12 text-center text-2xl tracking-widest" />
              </div>
              <Button type="submit" disabled={loading || code.length !== 6} className="w-full h-12 bg-[#C00000] hover:bg-[#A00000] text-white text-lg font-semibold">
                {loading ? "Verifying..." : "Verify & Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => { setStep("password"); setCode(""); setError(""); }} className="text-sm text-[#C00000] hover:underline">← Back to sign in</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#C00000] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dr. Paw</h1>
          <p className="text-slate-600">Veterinary Clinic Management</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Welcome Back</h2>
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{error}</p></div>}
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
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 bg-[#C00000] hover:bg-[#A00000] text-white text-lg font-semibold">
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-slate-600">Don't have an account?{" "}
              <Link href={redirectUrl ? `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}` : "/sign-up"} className="text-[#C00000] hover:underline font-semibold">Sign Up</Link>
            </p>
          </div>
        </div>
        <div className="text-center mt-6 text-sm text-slate-500">© 2026 Dr. Paw. All rights reserved.</div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center"><div className="text-slate-600">Loading...</div></div>}>
      <SignInContent />
    </Suspense>
  );
}