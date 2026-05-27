/** Sanitización de entradas del cliente — mitigación XSS en capa UI */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'/]/g, (ch) => HTML_ENTITIES[ch] ?? ch);
}

export function sanitizeEmail(email: string): string {
  return escapeHtml(email.trim().toLowerCase().slice(0, 255));
}

export function sanitizeSearchQuery(query: string): string {
  return escapeHtml(query.trim().replace(/[<>'"`;()]/g, '').slice(0, 120));
}

export function sanitizePassword(password: string): string {
  return password.slice(0, 128);
}
