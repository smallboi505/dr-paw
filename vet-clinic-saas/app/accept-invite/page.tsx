"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link - no token provided");
      setLoading(false);
      return;
    }

    // Verify the invite token
    fetch(`/api/invites/verify?token=${token}`)
      .then(async (res) => {
        console.log('Verify response status:', res.status);
        const data = await res.json();
        console.log('Verify response data:', data);
        
        if (res.ok) {
          setInviteData(data);
        } else {
          setError(data.error || "Invalid invite");
        }
      })
      .catch((err) => {
        console.error('Verify error:', err);
        setError("Failed to verify invite");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      // User not signed in - redirect to Clerk sign-up with return URL
      const returnUrl = `/accept-invite?token=${token}`;
      const signUpUrl = `/sign-up?redirect_url=${encodeURIComponent(returnUrl)}`;
      
      // For Clerk's sign-up (not our onboarding), we need to use Clerk's built-in pages
      // Redirect to sign-in page which has "Sign Up" option
      router.push(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setAccepting(true);

    try {
      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to accept invite");
      }
    } catch (error) {
      setError("Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#C00000] mx-auto mb-4" />
          <p className="text-slate-600">Verifying invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-slate-200">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Invite</h1>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-[#C00000] hover:bg-[#A00000]"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-slate-200">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome!</h1>
            <p className="text-slate-600 mb-6">
              You've successfully joined <strong>{inviteData.clinic.name}</strong>
            </p>
            <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-slate-200">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-16 h-16 bg-[#C00000] rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🐾</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">You're Invited!</h1>
          <p className="text-slate-600">Join {inviteData.clinic.name}</p>
        </div>

        {/* Invite Details */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 mb-6 border border-purple-100">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">Email</p>
              <p className="font-semibold text-slate-900">{inviteData.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Role</p>
              <p className="font-semibold text-slate-900">{inviteData.role}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Clinic</p>
              <p className="font-semibold text-slate-900">{inviteData.clinic.name}</p>
              {inviteData.clinic.location && (
                <p className="text-sm text-slate-600">{inviteData.clinic.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Action */}
        {user ? (
          <div className="space-y-4">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full bg-[#C00000] hover:bg-[#A00000] h-12"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Accept Invite & Join Clinic"
              )}
            </Button>
            <p className="text-xs text-center text-slate-500">
              You're signed in as {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                📋 To accept this invite:
              </p>
              <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
                <li>Click "Continue to Sign In" below</li>
                <li><strong>If you don't have an account:</strong> Click "Don't have an account? Sign Up" at the bottom of the sign-in page</li>
                <li>Use this email: <strong className="text-[#C00000]">{inviteData.email}</strong></li>
                <li>After creating your account, you'll return here</li>
                <li>Click "Accept Invite" to join {inviteData.clinic.name}</li>
              </ol>
            </div>
            <Button
              onClick={handleAccept}
              className="w-full bg-[#C00000] hover:bg-[#A00000] h-12"
            >
              Continue to Sign In
            </Button>
            <p className="text-xs text-center text-slate-500">
              You'll be redirected to sign in/sign up
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#C00000]" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}