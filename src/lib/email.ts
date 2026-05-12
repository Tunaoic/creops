import "server-only";
import { Resend } from "resend";

/**
 * Email helper — wraps Resend with a graceful fallback for dev mode.
 *
 * - PROD (RESEND_API_KEY set): real email send via Resend.
 * - DEV (no key): log to server console + return ok. The /join/[token]
 *   URL is still printed so the developer can copy-paste it manually.
 *
 * No template engine — keep it simple. If we add a 2nd email type, refactor
 * to React Email.
 */

interface InviteEmailInput {
  to: string;
  inviterName: string;
  workspaceName: string;
  joinUrl: string;
  role: string;
}

export interface SendResult {
  ok: boolean;
  /** True when email was actually sent. False when in dev fallback mode. */
  delivered: boolean;
  /** Reason / id for telemetry. */
  detail: string;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "CreOps <onboarding@resend.dev>";

export async function sendInviteEmail(input: InviteEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback — log to server console
    // eslint-disable-next-line no-console
    console.log(
      `\n=== INVITE EMAIL (dev fallback, no RESEND_API_KEY) ===\n` +
        `To: ${input.to}\n` +
        `Inviter: ${input.inviterName}\n` +
        `Workspace: ${input.workspaceName}\n` +
        `Role: ${input.role}\n` +
        `Join URL: ${input.joinUrl}\n` +
        `===\n`
    );
    return {
      ok: true,
      delivered: false,
      detail: "dev-mode-no-key",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: input.to,
      subject: `${input.inviterName} invited you to ${input.workspaceName} on CreOps`,
      html: renderInviteHtml(input),
      text: renderInviteText(input),
    });
    if (result.error) {
      console.error("[email] resend error:", result.error);
      return {
        ok: false,
        delivered: false,
        detail: `resend-error: ${result.error.message}`,
      };
    }
    return {
      ok: true,
      delivered: true,
      detail: result.data?.id ?? "no-id",
    };
  } catch (e) {
    console.error("[email] threw:", e);
    return {
      ok: false,
      delivered: false,
      detail: `threw: ${(e as Error).message}`,
    };
  }
}

function renderInviteHtml(input: InviteEmailInput): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>You're invited to ${escapeHtml(input.workspaceName)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 540px; margin: 40px auto; padding: 0 20px; color: #1c1917; line-height: 1.5;">
  <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 16px; padding: 32px;">
    <p style="font-size: 14px; color: #57534e; margin: 0 0 16px;">CreOps</p>
    <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 12px; line-height: 1.3;">
      ${escapeHtml(input.inviterName)} invited you to <span style="color: #65a30d;">${escapeHtml(input.workspaceName)}</span>
    </h1>
    <p style="font-size: 15px; color: #57534e; margin: 0 0 24px;">
      You've been invited to join as <strong>${escapeHtml(input.role)}</strong>. Click the button below to set up your account and join the workspace.
    </p>
    <a href="${input.joinUrl}" style="display: inline-block; background: #65a30d; color: white; padding: 12px 22px; border-radius: 999px; text-decoration: none; font-weight: 500; font-size: 15px;">
      Accept invite
    </a>
    <p style="font-size: 13px; color: #a8a29e; margin: 24px 0 0;">
      Or copy this link: <br>
      <a href="${input.joinUrl}" style="color: #65a30d; word-break: break-all;">${input.joinUrl}</a>
    </p>
    <p style="font-size: 12px; color: #a8a29e; margin: 24px 0 0; padding-top: 16px; border-top: 1px solid #e7e5e4;">
      This invite expires in 7 days. If you weren't expecting this, you can ignore the email.
    </p>
  </div>
</body>
</html>`;
}

function renderInviteText(input: InviteEmailInput): string {
  return [
    `${input.inviterName} invited you to join ${input.workspaceName} on CreOps`,
    ``,
    `You've been invited as ${input.role}.`,
    ``,
    `Accept the invite:`,
    input.joinUrl,
    ``,
    `This invite expires in 7 days.`,
    `If you weren't expecting this, you can ignore the email.`,
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
