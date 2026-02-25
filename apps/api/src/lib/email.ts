import { Resend } from "resend";
import { env } from "../env";

const resend = new Resend(env.RESEND_API_KEY);

const FROM_EMAIL = "Versado <onboarding@resend.dev>";

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${env.WEB_URL}/auth/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your Versado password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verifyUrl = `${env.WEB_URL}/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your Versado email",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Welcome to Versado! Please verify your email address:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}
