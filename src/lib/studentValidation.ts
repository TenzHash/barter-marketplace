// Common educational domain suffixes and university patterns
const STUDENT_DOMAIN_PATTERNS = [
  /\.edu$/i,
  /\.edu\.[a-z]{2}$/i, // e.g. .edu.ph, .edu.au
  /\.ac\.[a-z]{2}$/i,  // e.g. .ac.uk, .ac.jp
];

export function isStudentEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split('@')[1];

  if (!domain) return false;

  return STUDENT_DOMAIN_PATTERNS.some((pattern) => pattern.test(domain));
}