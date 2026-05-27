'use client';

import { getPasswordStrength } from '@/lib/passwordStrength';

export function PasswordStrengthBar({ password }: { password: string }) {
  const { label, color, percent } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full bg-[var(--input-bg)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10px] font-bold text-[var(--text-muted)]">
        Fortaleza: <span style={{ color }}>{label}</span>
      </p>
    </div>
  );
}
