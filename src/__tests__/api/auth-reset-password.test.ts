import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/reset-password/route";
import { prisma } from "@/lib/db";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/reset-password", () => {
  it("resets password with valid token", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      name: "Test",
      passwordHash: "$2a$12$old",
      resetToken: "hashedtoken",
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
    });
    mockPrisma.user.update.mockResolvedValue({} as never);

    const res = await POST(
      makeRequest({
        token: "rawtoken123",
        password: "newpassword123",
        confirmPassword: "newpassword123",
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Password reset successfully");
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user_1" },
        data: expect.objectContaining({
          resetToken: null,
          resetTokenExpiry: null,
        }),
      })
    );
  });

  it("returns 400 for invalid/expired token", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const res = await POST(
      makeRequest({
        token: "badtoken",
        password: "newpassword123",
        confirmPassword: "newpassword123",
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid or expired reset link");
  });

  it("returns 400 for validation errors", async () => {
    const res = await POST(
      makeRequest({
        token: "",
        password: "short",
        confirmPassword: "short",
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for mismatched passwords", async () => {
    const res = await POST(
      makeRequest({
        token: "validtoken",
        password: "newpassword123",
        confirmPassword: "different123",
      })
    );

    expect(res.status).toBe(400);
  });
});
