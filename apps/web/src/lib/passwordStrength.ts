export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  score: number;
  label: string;
  strength: PasswordStrength;
  color: string;
  percent: number;
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: '', strength: 'weak', color: '#e5e7eb', percent: 0 };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const percent = Math.min(100, (score / 5) * 100);

  if (score <= 1) {
    return { score, label: 'Débil', strength: 'weak', color: '#ef4444', percent };
  }
  if (score === 2) {
    return { score, label: 'Regular', strength: 'fair', color: '#f59e0b', percent };
  }
  if (score === 3) {
    return { score, label: 'Media', strength: 'good', color: '#eab308', percent };
  }
  return { score, label: 'Fuerte', strength: 'strong', color: '#22c55e', percent };
}
