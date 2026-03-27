"use client";

import { useState, Suspense, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

function SignInContent() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"password" | "code" | "forgot" | "reset">("password");
  const [code, setCode] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetCode, setResetCode] = useState("");

  const redirectUrl = searchParams.get("redirect_url") || "";
  const [formData, setFormData] = useState({ email: "", password: "" });

  // If already signed in, redirect to dashboard
  useEffect(() => {
    if (isSignedIn) {
      router.push("/select-clinic");
    }
  }, [isSignedIn]);

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

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setGoogleLoading(true);
    setError("");
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/select-clinic",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true);
    setError("");
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: resetEmail,
      });
      setStep("reset");
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });
      if (result.status === "complete") {
        await completeSignIn(result.createdSessionId);
      } else {
        setError("Reset failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid code or password");
    } finally {
      setLoading(false);
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

  // Show loading while redirecting if already signed in
  if (isSignedIn) {
    return pageShell(<div className="text-center py-8 text-slate-500">Redirecting...</div>);
  }

  if (step === "forgot") {
    return pageShell(
      <>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password?</h2>
        <p className="text-slate-600 mb-6">Enter your email and we'll send you a reset code.</p>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{error}</p></div>}
        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-slate-700 font-semibold flex items-center gap-2"><Mail className="h-4 w-4" />Email Address</Label>
            <Input id="reset-email" type="email" placeholder="your@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required className="text-slate-900 h-12" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 bg-[#C00000] hover:bg-[#A00000] text-white text-lg font-semibold">
            {loading ? "Sending..." : "Send Reset Code"}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => { setStep("password"); setError(""); }} className="text-sm text-[#C00000] hover:underline">← Back to sign in</button>
        </div>
      </>
    );
  }

  if (step === "reset") {
    return pageShell(
      <>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>
        <p className="text-slate-600 mb-6">Enter the code sent to <strong>{resetEmail}</strong> and your new password.</p>
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{error}</p></div>}
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Reset Code</Label>
            <Input type="text" placeholder="6-digit code" value={resetCode} onChange={(e) => setResetCode(e.target.value)} required maxLength={6} className="text-slate-900 h-12 text-center text-2xl tracking-widest" />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold flex items-center gap-2"><Lock className="h-4 w-4" />New Password</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Min 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="text-slate-900 h-12 pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 bg-[#C00000] hover:bg-[#A00000] text-white text-lg font-semibold">
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => { setStep("forgot"); setError(""); }} className="text-sm text-[#C00000] hover:underline">← Resend code</button>
        </div>
      </>
    );
  }

  if (step === "code") {
    return pageShell(
      <>
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
      </>
    );
  }

  return pageShell(
    <>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Welcome Back</h2>
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{error}</p></div>}

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-700 font-semibold flex items-center gap-2"><Lock className="h-4 w-4" />Password</Label>
            <button
              type="button"
              onClick={() => { setResetEmail(formData.email); setStep("forgot"); setError(""); }}
              className="text-sm text-[#C00000] hover:underline"
            >
              Forgot password?
            </button>
          </div>
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
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center"><div className="text-slate-600">Loading...</div></div>}>
      <SignInContent />
    </Suspense>
  );
}