/**
 * Student email utilities shared between client and server.
 * Charusat student emails follow the pattern:
 *   [optional prefix] dcs/dce/dit [suffix] @charusat.edu.in
 * e.g.: 22dcs001@charusat.edu.in, d22dcs001@charusat.edu.in
 */

const STUDENT_EMAIL_REGEX =
  /^[a-zA-Z0-9]*(?:dcs|dce|dit)[a-zA-Z0-9]*@charusat\.edu\.in$/i;

export function isStudentEmail(email: string): boolean {
  return STUDENT_EMAIL_REGEX.test(email);
}

export function detectDepartmentFromEmail(email: string): "DCS" | "DCE" | "DIT" | null {
  const lower = email.toLowerCase();
  if (lower.includes("dcs")) return "DCS";
  if (lower.includes("dce")) return "DCE";
  if (lower.includes("dit")) return "DIT";
  return null;
}
