import { DynamicStateObject } from "./../types/DynamicState";

function svgToDataUri(svg: DynamicStateObject) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const portraitSvgs = {
  arjun: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="36" fill="#E0F2FE"/>
      <circle cx="80" cy="62" r="28" fill="#F4C7A1"/>
      <path d="M52 55c4-20 18-30 36-30s30 9 36 30c-10-6-22-10-36-10S62 49 52 55Z" fill="#1E293B"/>
      <path d="M46 145c4-26 19-42 34-42h0c15 0 30 16 34 42" fill="#FFFFFF"/>
      <path d="M62 105h36l8 40H54l8-40Z" fill="#DBEAFE"/>
      <path d="M76 103h8v18h18v8H84v18h-8v-18H58v-8h18z" fill="#2563EB"/>
      <rect x="54" y="104" width="52" height="6" rx="3" fill="#BFDBFE"/>
    </svg>
  `),
  neha: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="36" fill="#ECFDF5"/>
      <circle cx="80" cy="62" r="28" fill="#F2C19C"/>
      <path d="M48 60c0-22 14-36 32-36 24 0 36 16 36 38-8-8-20-14-34-14-13 0-24 4-34 12z" fill="#0F172A"/>
      <path d="M50 145c5-24 18-40 30-40 12 0 25 16 30 40" fill="#FFFFFF"/>
      <path d="M58 108c6 8 14 12 22 12s16-4 22-12l8 37H50l8-37Z" fill="#D1FAE5"/>
      <circle cx="80" cy="117" r="5" fill="#10B981"/>
    </svg>
  `),
  rohan: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="36" fill="#EFF6FF"/>
      <circle cx="80" cy="62" r="28" fill="#EAB892"/>
      <path d="M53 58c2-21 17-34 35-34 20 0 34 13 36 33-12-6-25-10-37-10s-23 4-34 11z" fill="#334155"/>
      <path d="M46 145c5-28 20-42 34-42 14 0 29 14 34 42" fill="#FFFFFF"/>
      <path d="M60 105h40l7 40H53l7-40Z" fill="#DBEAFE"/>
      <path d="M78 103h4v42h-4z" fill="#93C5FD"/>
    </svg>
  `),
  sana: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="36" fill="#FEF3C7"/>
      <circle cx="80" cy="62" r="28" fill="#F6CAA5"/>
      <path d="M48 62c2-24 16-38 32-38 23 0 38 15 38 39-9-9-22-14-38-14-13 0-24 5-32 13z" fill="#3F2A1D"/>
      <path d="M50 145c4-23 19-40 30-40s26 17 30 40" fill="#FFFFFF"/>
      <path d="M60 106c5 6 12 10 20 10s15-4 20-10l10 39H50l10-39Z" fill="#FDE68A"/>
      <circle cx="80" cy="121" r="4.5" fill="#F59E0B"/>
    </svg>
  `),
  vikram: svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="36" fill="#F1F5F9"/>
      <circle cx="80" cy="62" r="28" fill="#E7B790"/>
      <path d="M50 58c4-22 19-34 37-34 19 0 33 12 35 34-10-7-23-12-37-12-12 0-24 4-35 12z" fill="#111827"/>
      <path d="M46 145c4-26 18-42 34-42s30 16 34 42" fill="#FFFFFF"/>
      <path d="M59 106h42l8 39H51l8-39Z" fill="#E2E8F0"/>
      <path d="M66 116h28" stroke="#2563EB" stroke-width="6" stroke-linecap="round"/>
    </svg>
  `)
};

export function getDoctorPortrait(doctor = {}) {
  // @ts-expect-error - Auto-suppressed during migration
  const key = String(doctor?.fullName || doctor?.name || "").toLowerCase();

  if (key.includes("arjun")) return portraitSvgs.arjun;
  if (key.includes("neha")) return portraitSvgs.neha;
  if (key.includes("rohan")) return portraitSvgs.rohan;
  if (key.includes("sana")) return portraitSvgs.sana;
  if (key.includes("vikram")) return portraitSvgs.vikram;

  return portraitSvgs.neha;
}
