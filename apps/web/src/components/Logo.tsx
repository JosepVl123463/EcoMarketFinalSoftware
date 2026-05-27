/** Logotipo vectorial minimalista — sin imágenes raster ni fuentes extra */
export function Logo({ className = '', size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="40" height="40" rx="8" fill="currentColor" className="text-[var(--primary)] dark:text-[#2d6a5a]" />
      <path
        d="M20 8C14 8 10 13 10 18c0 6 4 10 10 14 6-4 10-8 10-14 0-5-4-10-10-10z"
        fill="#FDFCF9"
        opacity="0.95"
      />
      <path d="M20 14v12M16 20h8" stroke="#1A3C34" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LogoWordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`text-xl font-bold tracking-tight text-[var(--primary)] dark:text-[#a8d5c4] ${className}`}>
      ecomarket
    </span>
  );
}
