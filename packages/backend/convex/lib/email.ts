// Transactional email via Resend (SPEC §7.4), used for alert notifications.
//
// Raw fetch against the Resend HTTP API rather than the SDK, matching the fetch-based style
// already used for outbound delivery. If RESEND_API_KEY is unset the call is a no-op that logs
// and returns false, so alerting (and the slice that depends on it) does not block on Resend
// domain verification. Runs in an action context only (network I/O).

const API_URL = 'https://api.resend.com/emails';

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ALERT_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn(
      JSON.stringify({
        msg: 'email_skipped_no_config',
        reason: !apiKey ? 'RESEND_API_KEY unset' : 'ALERT_FROM_EMAIL unset',
        to,
        subject,
      }),
    );
    return false;
  }

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 512);
      console.error(JSON.stringify({ msg: 'email_send_failed', status: res.status, detail }));
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      JSON.stringify({
        msg: 'email_send_error',
        error: err instanceof Error ? err.message : 'unknown',
      }),
    );
    return false;
  }
}
