import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/sessions/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/sessions", () => {
  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost:3000/api/sessions");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns user sessions", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.session.findMany.mockResolvedValue([
      { id: "s_1", title: "Workout", ownerId: "user_1" },
    ] as never);

    const req = new Request("http://localhost:3000/api/sessions");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("applies date range filters", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.session.findMany.mockResolvedValue([]);

    const req = new Request(
      "http://localhost:3000/api/sessions?from=2024-01-01&to=2024-01-31"
    );
    await GET(req);

    expect(mockPrisma.session.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerId: "user_1",
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        }),
      })
    );
  });
});

describe("POST /api/sessions", () => {
  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test",
        category: "strength",
        date: "2024-01-15",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("creates a session", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.session.create.mockResolvedValue({
      id: "s_new",
      title: "Morning Run",
      category: "cardio",
      ownerId: "user_1",
    } as never);

    const req = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Morning Run",
        category: "cardio",
        date: "2024-01-15",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid data", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });

    const req = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "",
        category: "invalid",
        date: "bad-date",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates session with template exercises", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.sessionTemplate.findFirst.mockResolvedValue({
      id: "tmpl_1",
      ownerId: "user_1",
      exercises: [
        {
          exerciseId: "ex_1",
          order: 0,
          defaultSets: 3,
          defaultReps: 10,
          defaultWeight: 135,
          defaultDurationSec: null,
        },
      ],
    } as never);
    mockPrisma.session.create.mockResolvedValue({
      id: "s_new",
      title: "From Template",
    } as never);

    const req = new Request("http://localhost:3000/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "From Template",
        category: "strength",
        date: "2024-01-15",
        templateId: "tmpl_1",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
