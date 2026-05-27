/** Logotipos estilizados y profesionales con gradientes y diseño premium para el checkout */

export function YapeLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Yape">
      <defs>
        <linearGradient id="yapeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7E247C" />
          <stop offset="100%" stopColor="#A839A2" />
        </linearGradient>
      </defs>
      <rect width="120" height="40" rx="12" fill="url(#yapeGradient)" />
      <circle cx="28" cy="20" r="10" fill="#FFF" opacity="0.2" />
      <path d="M22 18 L26 24 L34 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="74" y="26" fill="white" fontSize="22" fontWeight="900" fontFamily="'Outfit', 'Inter', sans-serif" letterSpacing="0.5">
        yape
      </text>
    </svg>
  );
}

export function PlinLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Plin">
      <defs>
        <linearGradient id="plinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00BFA5" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
      </defs>
      <rect width="120" height="40" rx="12" fill="url(#plinGradient)" />
      <path d="M25 15 L32 20 L25 25 Z" fill="white" />
      <path d="M25 15 L18 20 L25 25 Z" fill="white" opacity="0.6" />
      <text x="74" y="26" fill="white" fontSize="22" fontWeight="900" fontFamily="'Outfit', 'Inter', sans-serif" letterSpacing="0.5">
        plin
      </text>
    </svg>
  );
}

export function TuPayLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="TuPay">
      <defs>
        <linearGradient id="tupayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A3C34" />
          <stop offset="100%" stopColor="#2A5C50" />
        </linearGradient>
      </defs>
      <rect width="120" height="40" rx="12" fill="url(#tupayGradient)" />
      <rect x="22" y="14" width="12" height="12" rx="2" stroke="white" strokeWidth="2" fill="none" />
      <path d="M28 10 L28 14 M28 26 L28 30 M22 20 L18 20 M38 20 L34 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <text x="72" y="26" fill="white" fontSize="20" fontWeight="800" fontFamily="'Outfit', 'Inter', sans-serif" letterSpacing="0.5">
        TuPay
      </text>
    </svg>
  );
}

export function VisaLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Visa">
      <rect width="120" height="40" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1" />
      <text x="60" y="27" fill="#1A1F71" fontSize="24" fontWeight="900" fontFamily="Arial, sans-serif" fontStyle="italic" textAnchor="middle" letterSpacing="-1">
        VISA
      </text>
    </svg>
  );
}

export function MastercardLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mastercard">
      <rect width="120" height="40" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1" />
      <circle cx="50" cy="20" r="12" fill="#EB001B" />
      <circle cx="70" cy="20" r="12" fill="#F79E1B" opacity="0.9" />
    </svg>
  );
}

export function AmexLogo({ className = 'h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="American Express">
      <rect width="120" height="40" rx="8" fill="#002663" />
      <text x="60" y="25" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif" textAnchor="middle" letterSpacing="1">
        AMEX
      </text>
    </svg>
  );
}
