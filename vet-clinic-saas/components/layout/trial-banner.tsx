"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, X, Zap, AlertTriangle } from "lucide-react";

interface ClinicPlan {
  plan: string;
  rawPlan: string;
  trialEndsAt: string | null;
}

export default function TrialBanner() {
  const router = useRouter();
  const [planInfo, setPlanInfo] = useState<ClinicPlan | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/clinic/plan")
      .then(res => res.json())
      .then(data => setPlanInfo(data))
      .catch(() => {});
  }, []);

  if (!planInfo || dismissed) return null;

  const { rawPlan, trialEndsAt } = planInfo;

  // Only show for TRIAL plan
  if (rawPlan !== "TRIAL") return null;

  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isExpired = daysLeft === 0;
  const isUrgent = daysLeft <= 5 && daysLeft > 0;

  const bgColor = isExpired
    ? "bg-red-600"
    : isUrgent
    ? "bg-amber-500"
    : "bg-[#36346A]";

  return (
    <div className={`${bgColor} text-white px-4 py-2.5 flex items-center justify-between gap-4`}>
      <div className="flex items-center gap-3">
        {isExpired ? (
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        ) : (
          <Clock className="h-4 w-4 flex-shrink-0" />
        )}
        <p className="text-sm font-medium">
          {isExpired
            ? "Your free trial has expired. Upgrade now to keep access to all features."
            : `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Enjoying Dr. Paw? Upgrade to keep full access.`
          }
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => router.push("/upgrade")}
          className="flex items-center gap-1.5 bg-white text-[#C00000] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors"
        >
          <Zap className="h-3 w-3" />
          Upgrade Now
        </button>
        {!isExpired && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}