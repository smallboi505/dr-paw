/**
 * Dr. Paw Plan Configuration
 * Single source of truth for all plan limits and features
 */

export type Plan = "TRIAL" | "FREE" | "PRO" | "ENTERPRISE";
export type BillingCycle = "monthly" | "annual";

export interface PlanLimits {
  maxPets: number | null;        // null = unlimited
  maxStaff: number | null;       // null = unlimited
  maxAdmins: number;
  maxVets: number | null;
  maxNurses: number | null;
  maxReceptionists: number | null;
  canImport: boolean;
  canExport: boolean;
  customPetIds: boolean;
  customBranding: boolean;
  support: "none" | "email" | "priority_24_7";
  training: "none" | "onboarding" | "onboarding_plus_workshops";
}

export interface PlanPrice {
  monthly: number;  // in pesewas (GHS x 100)
  annual: number;   // in pesewas (GHS x 100)
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  TRIAL: {
    maxPets: 300,
    maxStaff: 3,
    maxAdmins: 1,
    maxVets: 2,
    maxNurses: null,
    maxReceptionists: null,
    canImport: true,
    canExport: true,
    customPetIds: false,
    customBranding: false,
    support: "email",
    training: "onboarding",
  },
  FREE: {
    maxPets: 50,
    maxStaff: 1,
    maxAdmins: 1,
    maxVets: 0,
    maxNurses: 0,
    maxReceptionists: 0,
    canImport: false,
    canExport: true,
    customPetIds: false,
    customBranding: false,
    support: "none",
    training: "none",
  },
  PRO: {
    maxPets: 300,
    maxStaff: 3,
    maxAdmins: 1,
    maxVets: 2,
    maxNurses: null,
    maxReceptionists: null,
    canImport: true,
    canExport: true,
    customPetIds: false,
    customBranding: false,
    support: "email",
    training: "onboarding",
  },
  ENTERPRISE: {
    maxPets: null,
    maxStaff: null,
    maxAdmins: 2,
    maxVets: 10,
    maxNurses: 10,
    maxReceptionists: 2,
    canImport: true,
    canExport: true,
    customPetIds: true,
    customBranding: true,
    support: "priority_24_7",
    training: "onboarding_plus_workshops",
  },
};

export const PLAN_PRICES: Record<Exclude<Plan, "TRIAL" | "FREE">, PlanPrice> = {
  PRO: {
    monthly: 89900,   // ₵899
    annual: 899000,   // ₵8,990
  },
  ENTERPRISE: {
    monthly: 169900,  // ₵1,699
    annual: 1699000,  // ₵16,990
  },
};

export const PLAN_NAMES: Record<Plan, string> = {
  TRIAL: "Free Trial",
  FREE: "Free",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
};

export const TRIAL_DAYS = 30;

/**
 * Get plan limits for a clinic
 */
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * Check if a clinic can add more pets
 */
export function canAddPet(plan: Plan, currentPetCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxPets === null) return true;
  return currentPetCount < limits.maxPets;
}

/**
 * Check if a clinic can add more staff
 */
export function canAddStaff(plan: Plan, currentStaffCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.maxStaff === null) return true;
  return currentStaffCount < limits.maxStaff;
}

/**
 * Check if trial has expired
 */
export function isTrialExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return new Date() > trialEndsAt;
}

/**
 * Get effective plan (if trial expired, treat as FREE)
 */
export function getEffectivePlan(plan: Plan, trialEndsAt: Date | null): Plan {
  if (plan === "TRIAL" && isTrialExpired(trialEndsAt)) return "FREE";
  return plan;
}

/**
 * Days remaining in trial
 */
export function trialDaysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  const diff = trialEndsAt.getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Format price for display
 */
export function formatPrice(pesewas: number): string {
  return `₵${(pesewas / 100).toLocaleString()}`;
}