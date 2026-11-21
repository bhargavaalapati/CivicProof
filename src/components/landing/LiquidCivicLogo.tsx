// src/components/landing/LiquidCivicLogo.tsx
export function LiquidCivicLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`relative flex items-center justify-center shrink-0 ${
          compact ? "w-8 h-8" : "w-10 h-10"
        }`}
      >
        <svg
          viewBox="0 0 64 64"
          className={`${compact ? "w-8 h-8" : "w-10 h-10"} liquid-logo-anim`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="civicLiquidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="55%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          <path
            d="M32 6C45.5 6 57 14.8 58 29.2C59 43.6 47.4 58 32 58C16.6 58 6 46.8 6 32C6 17.2 18.5 6 32 6Z"
            fill="url(#civicLiquidGrad)"
          />
          <rect x="20" y="21" width="10" height="22" rx="3" fill="#FAF9F6" fillOpacity="0.92" />
          <rect x="34" y="21" width="10" height="22" rx="3" fill="#93C5FD" fillOpacity="0.95" />
          <line
            x1="32"
            y1="16"
            x2="32"
            y2="48"
            stroke="#FAF9F6"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="leading-tight">
        <span className={`block font-bold tracking-tight text-slate-950 ${compact ? "text-base" : "text-lg"}`}>
          CivicProof
        </span>
        {!compact && (
          <span className="block text-[11px] font-medium text-slate-600">
            Before/After Evidence Workspace
          </span>
        )}
      </div>
    </div>
  );
}