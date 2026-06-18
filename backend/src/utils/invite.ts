// Generates short, human-friendly family invite codes.
// Avoids ambiguous characters (0/O, 1/I) so they're easy to read and type.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
