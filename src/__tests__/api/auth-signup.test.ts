import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/signup/route";
import { prisma } from "@/lib/db";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup", () => {
  it("creates a new user with valid data", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "$2a$12$hashed",
      resetToken: null,
      resetTokenExpiry: null,
    });

    const res = await POST(
      makeRequest({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.email).toBe("test@example.com");
    expect(json.name).toBe("Test User");
    expect(json).not.toHaveProperty("passwordHash");
  });

  it("lowercases the email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: "user_1",
      email: "test@example.com",
      name: "Test",
      passwordHash: "$2a$12$hashed",
      resetToken: null,
      resetTokenExpiry: null,
    });

    await POST(
      makeRequest({
        name: "Test",
        email: "Test@Example.COM",
        password: "password123",
        confirmPassword: "password123",
      })
    );

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
  });

  it("returns 400 for validation errors", async () => {
    const res = await POST(
      makeRequest({
        name: "",
        email: "bad",
        password: "short",
        confirmPassword: "short",
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for mismatched passwords", async () => {
    const res = await POST(
      makeRequest({
        name: "Test",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different123",
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 if email already exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "existing",
      email: "test@example.com",
      name: "Existing",
      passwordHash: "$2a$12$hashed",
      resetToken: null,
      resetTokenExpiry: null,
    });

    const res = await POST(
      makeRequest({
        name: "Test",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.email).toBeDefined();
  });

  it("returns 500 on unexpected error", async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error("DB down"));

    const res = await POST(
      makeRequest({
        name: "Test",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      })
    );

    expect(res.status).toBe(500);
  });
});
