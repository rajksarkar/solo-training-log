import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/exercises/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/exercises", () => {
  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost:3000/api/exercises");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns exercises for authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "test@test.com", name: "Test" },
      expires: "2099-01-01",
    });
    const exercises = [
      { id: "ex_1", name: "Squat", category: "strength", ownerId: null },
      { id: "ex_2", name: "My Exercise", category: "cardio", ownerId: "user_1" },
    ];
    mockPrisma.exercise.findMany.mockResolvedValue(exercises as never);

    const req = new Request("http://localhost:3000/api/exercises");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(2);
  });

  it("passes search query to filter", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "test@test.com", name: "Test" },
      expires: "2099-01-01",
    });
    mockPrisma.exercise.findMany.mockResolvedValue([]);

    const req = new Request("http://localhost:3000/api/exercises?q=squat");
    await GET(req);

    expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              name: { contains: "squat", mode: "insensitive" },
            }),
          ]),
        }),
      })
    );
  });

  it("filters by category", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "test@test.com", name: "Test" },
      expires: "2099-01-01",
    });
    mockPrisma.exercise.findMany.mockResolvedValue([]);

    const req = new Request(
      "http://localhost:3000/api/exercises?category=strength"
    );
    await GET(req);

    expect(mockPrisma.exercise.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: "strength",
        }),
      })
    );
  });
});

describe("POST /api/exercises", () => {
  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost:3000/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", category: "strength" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("creates exercise for authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "test@test.com", name: "Test" },
      expires: "2099-01-01",
    });
    const created = {
      id: "ex_new",
      name: "Custom Press",
      category: "strength",
      ownerId: "user_1",
      equipment: [],
      muscles: [],
      instructions: "",
      youtubeId: null,
    };
    mockPrisma.exercise.create.mockResolvedValue(created as never);

    const req = new Request("http://localhost:3000/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Custom Press", category: "strength" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name).toBe("Custom Press");
    expect(json.ownerId).toBe("user_1");
  });

  it("returns 400 for invalid data", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "test@test.com", name: "Test" },
      expires: "2099-01-01",
    });

    const req = new Request("http://localhost:3000/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", category: "invalid" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
