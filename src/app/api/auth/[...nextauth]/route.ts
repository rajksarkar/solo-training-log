import { NextResponse } from "next/server";

// NextAuth is no longer used. Auth is handled via /api/auth/login
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
