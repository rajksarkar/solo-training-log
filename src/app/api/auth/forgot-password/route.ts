import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = parsed.data;

  // Always return the same message to prevent email enumeration
  const successMessage =
    "If an account exists with that email, you'll receive a reset link.";

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: hashedToken, resetTokenExpiry: expiry },
      });

      const baseUrl = process.env.NEXTAUTH_URL
        ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const resetUrl = `${baseUrl}/reset-password/${rawToken}`;

      await sendPasswordResetEmail(user.email, resetUrl);
    }
  } catch (err) {
    console.error("Forgot password error:", err);
  }

  return NextResponse.json({ message: successMessage });
}
