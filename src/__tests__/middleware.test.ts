import { describe, it, expect, vi, beforeEach } from "vitest";
import { getToken } from "next-auth/jwt";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

const mockGetToken = vi.mocked(getToken);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(path: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("middleware", () => {
  describe("protected app routes", () => {
    it("redirects unauthenticated user from /app to /login", async () => {
      mockGetToken.mockResolvedValue(null);
      const res = await middleware(makeRequest("/app"));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    });

    it("redirects unauthenticated user from /app/sessions to /login", async () => {
      mockGetToken.mockResolvedValue(null);
      const res = await middleware(makeRequest("/app/sessions"));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    });

    it("allows authenticated user to access /app", async () => {
      mockGetToken.mockResolvedValue({ id: "user_1", email: "t@t.com" });
      const res = await middleware(makeRequest("/app"));
      expect(res.status).toBe(200);
    });

    it("allows authenticated user to access /app/exercises", async () => {
      mockGetToken.mockResolvedValue({ id: "user_1", email: "t@t.com" });
      const res = await middleware(makeRequest("/app/exercises"));
      expect(res.status).toBe(200);
    });
  });

  describe("auth routes", () => {
    it("redirects authenticated user from /login to /app", async () => {
      mockGetToken.mockResolvedValue({ id: "user_1", email: "t@t.com" });
      const res = await middleware(makeRequest("/login"));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/app");
    });

    it("redirects authenticated user from /signup to /app", async () => {
      mockGetToken.mockResolvedValue({ id: "user_1", email: "t@t.com" });
      const res = await middleware(makeRequest("/signup"));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/app");
    });

    it("redirects authenticated user from /forgot-password to /app", async () => {
      mockGetToken.mockResolvedValue({ id: "user_1", email: "t@t.com" });
      const res = await middleware(makeRequest("/forgot-password"));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/app");
    });

    it("redirects authenticated user from /reset-password/token to /app", async () => {
      mockGetToken.mockResolvedValue({ id: "user_1", email: "t@t.com" });
      const res = await middleware(makeRequest("/reset-password/abc123"));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/app");
    });

    it("allows unauthenticated user to access /login", async () => {
      mockGetToken.mockResolvedValue(null);
      const res = await middleware(makeRequest("/login"));
      expect(res.status).toBe(200);
    });

    it("allows unauthenticated user to access /signup", async () => {
      mockGetToken.mockResolvedValue(null);
      const res = await middleware(makeRequest("/signup"));
      expect(res.status).toBe(200);
    });
  });

  describe("other routes", () => {
    it("passes through for non-matched routes", async () => {
      mockGetToken.mockResolvedValue(null);
      const res = await middleware(makeRequest("/about"));
      expect(res.status).toBe(200);
    });
  });
});
