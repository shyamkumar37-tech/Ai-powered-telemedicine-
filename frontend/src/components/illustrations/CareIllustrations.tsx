import { DynamicState } from "./../../types/DynamicState";
export function DashboardCareIllustration() {
  return (
    <svg viewBox="0 0 320 220" className="h-full w-full" role="img" aria-label="Care dashboard illustration">
      <defs>
        <linearGradient id="dashCard" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="dashPulse" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <rect x="24" y="20" width="272" height="180" rx="28" fill="url(#dashCard)" />
      <rect x="46" y="42" width="98" height="56" rx="18" fill="#EFF6FF" />
      <rect x="158" y="42" width="116" height="56" rx="18" fill="#ECFDF5" />
      <rect x="46" y="116" width="228" height="62" rx="22" fill="#FFFFFF" />
      <path d="M64 150h28l12-18 18 30 18-22 12 10 18-26 14 26h30" fill="none" stroke="url(#dashPulse)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="86" cy="70" r="16" fill="#2563EB" opacity="0.9" />
      <circle cx="218" cy="70" r="16" fill="#10B981" opacity="0.9" />
      <path d="M86 61v18M77 70h18" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      <path d="M212 71l6 6 12-14" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface EmptyStateIllustrationProps {
  variant?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export function EmptyStateIllustration({ variant = "generic" }: EmptyStateIllustrationProps) {
  const accent = variant === "doctors" ? "#2563EB" : variant === "mental-health" ? "#10B981" : "#0F766E";

  return (
    <svg viewBox="0 0 240 180" className="h-40 w-full max-w-[220px]" role="img" aria-label="Empty state illustration">
      <rect x="26" y="24" width="188" height="132" rx="28" fill="#F8FAFC" />
      <rect x="44" y="42" width="152" height="96" rx="22" fill="#FFFFFF" stroke="#E2E8F0" />
      <circle cx="84" cy="76" r="18" fill={accent} opacity="0.12" />
      <circle cx="84" cy="76" r="9" fill={accent} />
      <rect x="108" y="64" width="56" height="8" rx="4" fill="#CBD5E1" />
      <rect x="108" y="80" width="72" height="8" rx="4" fill="#E2E8F0" />
      <rect x="62" y="112" width="116" height="10" rx="5" fill="#EFF6FF" />
      <path d="M150 18c16 6 30 22 32 38" fill="none" stroke="#BFDBFE" strokeWidth="8" strokeLinecap="round" />
      <path d="M64 150c14 8 32 12 54 12 23 0 43-5 58-14" fill="none" stroke="#D1FAE5" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

export function MentalHealthIllustration() {
  return (
    <svg viewBox="0 0 320 240" className="h-full w-full" role="img" aria-label="Mental wellness illustration">
      <defs>
        <linearGradient id="calmBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#D1FAE5" />
        </linearGradient>
      </defs>
      <rect x="24" y="24" width="272" height="192" rx="40" fill="url(#calmBg)" />
      <circle cx="106" cy="106" r="42" fill="#FFFFFF" opacity="0.88" />
      <path d="M90 104c10-14 24-18 34-12 10 5 11 19 3 31-9 13-23 20-34 16-14-5-15-21-3-35Z" fill="#10B981" opacity="0.22" />
      <path d="M170 94c12-20 40-26 58-8 14 15 13 39-2 54-16 17-44 17-58-3-9-12-8-29 2-43Z" fill="#FFFFFF" opacity="0.82" />
      <path d="M100 158c16 15 37 22 63 22 34 0 58-11 76-32" fill="none" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" />
      <circle cx="104" cy="105" r="6" fill="#2563EB" />
      <circle cx="190" cy="114" r="6" fill="#10B981" />
      <circle cx="220" cy="114" r="6" fill="#10B981" />
      <path d="M188 132c10 8 24 8 34 0" fill="none" stroke="#0F766E" strokeWidth="5" strokeLinecap="round" />
      <path d="M92 121c6 6 17 6 24 0" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
