import { NextResponse } from "next/server";
import { verifyCode, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const token = await verifyCode(code);

    if (!token) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60, // 90 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
