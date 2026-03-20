import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "solo-token";
const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "solo-training-secret-key-change-me"
);

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // API routes bypass middleware (auth handled in route handlers)
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const loggedIn = await isAuthenticated(request);
  const isAppRoute = request.nextUrl.pathname.startsWith("/app");
  const isLoginRoute = request.nextUrl.pathname === "/login";

  // Protect /app routes
  if (isAppRoute && !loggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged-in users away from login
  if (isLoginRoute && loggedIn) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login"],
};
