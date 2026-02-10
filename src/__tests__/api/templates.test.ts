import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/templates/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/templates", () => {
  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns user templates", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.sessionTemplate.findMany.mockResolvedValue([
      { id: "tmpl_1", title: "Push Day" },
    ] as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
  });
});

describe("POST /api/templates", () => {
  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost:3000/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", category: "strength" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("creates a template", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.sessionTemplate.create.mockResolvedValue({
      id: "tmpl_new",
      title: "Pull Day",
      category: "strength",
    } as never);

    const req = new Request("http://localhost:3000/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Pull Day", category: "strength" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid data", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });

    const req = new Request("http://localhost:3000/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", category: "bad" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
