import "server-only";

import { type CreateEmailOptions, Resend } from "resend";
import { getErrorMessage } from "@/lib/utils";

type SystemResendConfig = {
  apiKey: string;
  fromEmail: string;
};

function getSystemResendConfig(): SystemResendConfig | null {
  const apiKey = process.env.RESEND_SYSTEM_API_KEY;
  const fromEmail = process.env.RESEND_SYSTEM_FROM_EMAIL;

  if (!(apiKey && fromEmail)) {
    return null;
  }

  return { apiKey, fromEmail };
}

function getAppBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function isSystemMailerConfigured(): boolean {
  return getSystemResendConfig() !== null;
}

export async function sendSystemEmail(input: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<{ success: boolean; error?: string }> {
  const config = getSystemResendConfig();

  if (!config) {
    return {
      success: false,
      error: "System Resend is not configured",
    };
  }

  try {
    const resend = new Resend(config.apiKey);
    const emailPayload: CreateEmailOptions = {
      from: config.fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html ?? "",
      ...(input.text ? { text: input.text } : {}),
    };

    const result = await resend.emails.send(emailPayload);

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "Failed to send email",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to send email: ${getErrorMessage(error)}`,
    };
  }
}

export async function sendTeamInviteEmail(input: {
  to: string;
  teamName: string;
  inviterName?: string | null;
  inviteUrl?: string;
  inviteId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const appName = "Darkmatter Agents";
  const appUrl =
    input.inviteUrl ||
    (input.inviteId
      ? `${getAppBaseUrl()}/invite/${input.inviteId}`
      : `${getAppBaseUrl()}/login`);
  const inviterName = input.inviterName?.trim() || "A teammate";
  const teamName = input.teamName?.trim() || "your team";

  const subject = `${inviterName} added you to ${teamName} on ${appName}`;
  const text = `${inviterName} added you to ${teamName} on ${appName}. Team: ${teamName}. Open ${appUrl} to access the team.`;
  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${appName} Invitation</title>
      </head>
      <body style="margin:0;padding:32px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;box-shadow:0 20px 70px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px 32px;">
              <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:16px;">
                Invitation
              </div>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Join ${teamName}</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:24px;color:#334155;">
                ${inviterName} added you to <strong style="color:#0f172a;">${teamName}</strong> on ${appName}.
              </p>
              <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#475569;">
                Open the workspace to collaborate on workflows, manage runs, and keep your team aligned.
              </p>
              <div style="margin:0 0 22px;">
                <a href="${appUrl}" style="display:inline-block;padding:12px 16px;border-radius:10px;background:#0f172a;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;">Open ${appName}</a>
              </div>
              <p style="margin:0;font-size:13px;line-height:20px;color:#64748b;">
                If you were not expecting this invitation, you can ignore this email.
              </p>
              <div style="border-top:1px solid #e2e8f0;margin-top:22px;padding-top:14px;font-size:12px;line-height:18px;color:#94a3b8;">
                Sent by ${appName}
              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return await sendSystemEmail({
    to: input.to,
    subject,
    text,
    html,
  });
}
