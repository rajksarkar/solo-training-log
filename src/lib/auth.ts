import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const VALID_CODE = "baban2016";
const COOKIE_NAME = "solo-token";
const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "solo-training-secret-key-change-me"
);

// Default user info (single-user app)
const DEFAULT_USER = {
  email: "raj.sarkar@gmail.com",
  name: "Raj Sarkar",
};

export async function verifyCode(code: string): Promise<string | null> {
  if (code !== VALID_CODE) return null;

  // Find or create the user
  let user = await prisma.user.findUnique({
    where: { email: DEFAULT_USER.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEFAULT_USER.email,
        name: DEFAULT_USER.name,
      },
    });
  }

  // Create JWT
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("90d")
    .sign(SECRET);

  return token;
}

export async function auth() {
  // Try cookie first (web)
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // Fall back to Authorization header (API key / Bearer token)
  if (!token) {
    const { headers } = await import("next/headers");
    const headersList = await headers();

    // Check X-API-Key header (for programmatic access from Claude Code)
    const apiKey = headersList.get("x-api-key");
    if (apiKey === VALID_CODE) {
      const user = await prisma.user.findUnique({
        where: { email: DEFAULT_USER.email },
      });
      if (user) {
        return {
          user: { id: user.id, email: user.email, name: user.name },
          expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }
    }

    // Check Bearer token
    const authorization = headersList.get("authorization");
    if (authorization?.startsWith("Bearer ")) {
      return verifyToken(authorization.slice(7));
    }

    return null;
  }

  return verifyToken(token);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        name: (payload.name as string) ?? null,
      },
      expires: new Date((payload.exp ?? 0) * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
