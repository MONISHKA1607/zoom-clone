// Matches 10 digits, with optional "-" or spaces between the groups.
// It works on a bare ID ("1234567890") or inside a full invite link.
const CODE_PATTERN = /(\d{3})[-\s]?(\d{3})[-\s]?(\d{4})/;

export function extractMeetingCode(input: string): string | null {
  const match = input.match(CODE_PATTERN);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}