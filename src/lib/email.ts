import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  await getResend().emails.send({
    from: `Solo Training Log <${fromEmail}>`,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Click the link below to set a new password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #006d40; color: #ffffff; text-decoration: none; border-radius: 8px;">Reset Password</a></p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
