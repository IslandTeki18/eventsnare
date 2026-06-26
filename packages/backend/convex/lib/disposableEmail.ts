// ponytail: short static list of the most common throwaway-email providers. Email is only a
// soft signal here; the real anti-farming lever is the verified-phone ledger. Swap to the
// `disposable-email-domains` npm package (a maintained JSON list) if disposable-email abuse
// actually shows up.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'throwawaymail.com',
  'getnada.com',
  'trashmail.com',
  'sharklasers.com',
  'maildrop.cc',
  'dispostable.com',
  'fakeinbox.com',
  'mailnesia.com',
  'mintemail.com',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}
