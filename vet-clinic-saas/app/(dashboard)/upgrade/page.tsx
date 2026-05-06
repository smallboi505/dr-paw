"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, Building2, Crown, AlertCircle, Clock } from "lucide-react";
import { PLAN_LIMITS, PLAN_PRICES, PLAN_NAMES, formatPrice, type Plan, type BillingCycle } from "@/lib/plans";

interface ClinicPlan {
  plan: Plan;
  trialEndsAt: string | null;
  subscription: {
    billingCycle: string;
    currentPeriodEnd: string;
    status: string;
  } | null;
}

export default function UpgradePage() {
  const router = useRouter();
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [clinicPlan, setClinicPlan] = useState<ClinicPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/clinic/plan")
      .then(res => res.json())
      .then(data => { setClinicPlan(data); setLoading(false); })
      .catch(() => setLoading(false));

    // Check for success/error params
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setError("Payment failed or was cancelled. Please try again.");
    }
  }, []);

  const handleUpgrade = async (plan: "PRO" | "ENTERPRISE") => {
    setUpgrading(plan);
    setError("");
    try {
      const res = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingCycle: billing }),
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setError("Failed to initialize payment. Please try again.");
        setUpgrading(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setUpgrading(null);
    }
  };

  const currentPlan = clinicPlan?.plan || "FREE";
  const trialEndsAt = clinicPlan?.trialEndsAt ? new Date(clinicPlan.trialEndsAt) : null;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const plans = [
    {
      key: "FREE" as Plan,
      name: "Free",
      icon: <Zap className="h-6 w-6" />,
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "1 Admin account",
        "Up to 50 pet records",
        "Appointments & visits",
        "Export records (CSV)",
        "Basic reporting",
      ],
      cta: "Current Plan",
      highlighted: false,
    },
    {
      key: "PRO" as Plan,
      name: "Pro",
      icon: <Building2 className="h-6 w-6" />,
      monthlyPrice: PLAN_PRICES.PRO.monthly,
      annualPrice: PLAN_PRICES.PRO.annual,
      features: [
        "Everything in Free",
        "Up to 300 pet records",
        "1 Admin + 2 Vets",
        "CSV import & export",
        "Full medical records",
        "Onboarding training session",
        "Email support (24hr response)",
      ],
      cta: "Upgrade to Pro",
      highlighted: true,
    },
    {
      key: "ENTERPRISE" as Plan,
      name: "Enterprise",
      icon: <Crown className="h-6 w-6" />,
      monthlyPrice: PLAN_PRICES.ENTERPRISE.monthly,
      annualPrice: PLAN_PRICES.ENTERPRISE.annual,
      features: [
        "Everything in Pro",
        "Unlimited pet records",
        "2 Admins · 10 Vets · 10 Nurses · 2 Receptionists",
        "Custom pet ID formats",
        "Dedicated account manager",
        "Onboarding + workshops on request",
        "Custom branding on exports",
        "24/7 priority support",
      ],
      cta: "Upgrade to Enterprise",
      highlighted: false,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Plans & Billing</h1>
        <p className="text-slate-600 mt-1">Manage your subscription and upgrade your plan</p>
      </div>

      {/* Trial banner */}
      {currentPlan === "TRIAL" && trialDaysLeft > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">
              {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left in your free trial
            </p>
            <p className="text-sm text-amber-700">
              You're on a full Pro trial. Upgrade before it expires to keep all features.
            </p>
          </div>
        </div>
      )}

      {/* Trial expired banner */}
      {currentPlan === "TRIAL" && trialDaysLeft === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Your free trial has expired</p>
            <p className="text-sm text-red-700">Upgrade now to regain full access to all features.</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Billing toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-white border border-slate-200 rounded-full p-1 flex gap-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-600 transition-all ${
              billing === "monthly"
                ? "bg-[#C00000] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              billing === "annual"
                ? "bg-[#C00000] text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Annually
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              billing === "annual" ? "bg-white text-[#C00000]" : "bg-green-100 text-green-700"
            }`}>
              2 months free
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.key ||
            (currentPlan === "TRIAL" && plan.key === "PRO");
          const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          const isUpgrading = upgrading === plan.key;

          return (
            <div
              key={plan.key}
              className={`bg-white rounded-2xl border-2 overflow-hidden relative transition-all hover:-translate-y-1 hover:shadow-lg ${
                plan.highlighted
                  ? "border-[#C00000] scale-[1.02]"
                  : "border-slate-200"
              }`}
            >
              {plan.highlighted && (
                <div className="bg-[#C00000] text-white text-xs font-bold text-center py-1.5 tracking-wider">
                  MOST POPULAR
                </div>
              )}

              <div className="p-6">
                {/* Plan header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.highlighted ? "bg-[#C00000] text-white" : "bg-slate-100 text-slate-600"
                  }`}>
                    {plan.icon}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg italic">{plan.name}</div>
                    {isCurrentPlan && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Current plan
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {plan.key === "FREE" ? (
                    <div className="text-4xl font-bold text-slate-900">₵0</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold text-slate-900">
                        {formatPrice(price)}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {billing === "monthly" ? "per month" : "per year"}
                      </div>
                    </>
                  )}
                </div>

                {/* Features */}
                <div className="bg-[#C00000] rounded-xl p-4 mb-6">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs font-medium" style={{ color: "#36346A" }}>
                        <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-white opacity-70" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                {plan.key === "FREE" ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-slate-200 text-slate-400 cursor-not-allowed"
                  >
                    {isCurrentPlan ? "Current Plan" : "Downgrade"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.key as "PRO" | "ENTERPRISE")}
                    disabled={isCurrentPlan || isUpgrading}
                    className={`w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      isCurrentPlan
                        ? "border-slate-200 text-slate-400 cursor-not-allowed"
                        : "border-[#C00000] text-[#C00000] hover:bg-[#C00000] hover:text-white"
                    }`}
                  >
                    {isUpgrading
                      ? "Redirecting to payment..."
                      : isCurrentPlan
                      ? "Current Plan"
                      : plan.cta}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-sm text-slate-500 mt-8">
        All plans include a 30-day free trial. No credit card required to start. Cancel anytime.
      </p>
    </div>
  );
}