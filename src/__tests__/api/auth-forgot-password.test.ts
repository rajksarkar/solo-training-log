import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/forgot-password/route";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const mockPrisma = vi.mocked(prisma);
const mockSendEmail = vi.mocked(sendPasswordResetEmail);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
  it("returns success message even if user does not exist (no enumeration)", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({ email: "unknown@example.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("If an account exists");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("sends reset email if user exists", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      name: "Test",
      passwordHash: "$2a$12$hashed",
      resetToken: null,
      resetTokenExpiry: null,
    });
    mockPrisma.user.update.mockResolvedValue({} as never);
    mockSendEmail.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledOnce();
    expect(mockPrisma.user.update).toHaveBeenCalledOnce();
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ email: "bad" }));
    expect(res.status).toBe(400);
  });

  it("returns success even if email sending fails (no leak)", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      name: "Test",
      passwordHash: "$2a$12$hashed",
      resetToken: null,
      resetTokenExpiry: null,
    });
    mockPrisma.user.update.mockResolvedValue({} as never);
    mockSendEmail.mockRejectedValue(new Error("Email service down"));

    const res = await POST(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(200);
  });
});
