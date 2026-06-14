/** Tiny crypto-random ID generator — no external dependency needed. */
export function nanoid(size = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
