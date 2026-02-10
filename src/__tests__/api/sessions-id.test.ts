import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "@/app/api/sessions/[id]/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

const params = Promise.resolve({ id: "s_1" });

describe("GET /api/sessions/[id]", () => {
  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost:3000/api/sessions/s_1");
    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 if session not found", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.session.findFirst.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/sessions/s_1");
    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns session with exercises", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.session.findFirst.mockResolvedValue({
      id: "s_1",
      title: "Test",
      exercises: [],
    } as never);

    const req = new Request("http://localhost:3000/api/sessions/s_1");
    const res = await GET(req, { params });
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/sessions/[id]", () => {
  it("returns 404 if session not found or doesn't belong to user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.session.findFirst.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/sessions/s_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });

  it("updates session", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.session.findFirst.mockResolvedValue({
      id: "s_1",
      ownerId: "user_1",
    } as never);
    mockPrisma.session.update.mockResolvedValue({
      id: "s_1",
      title: "Updated",
    } as never);

    const req = new Request("http://localhost:3000/api/sessions/s_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/sessions/[id]", () => {
  it("returns 404 if session not found", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.session.findFirst.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/sessions/s_1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(404);
  });

  it("deletes own session", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.session.findFirst.mockResolvedValue({
      id: "s_1",
      ownerId: "user_1",
    } as never);
    mockPrisma.session.delete.mockResolvedValue({} as never);

    const req = new Request("http://localhost:3000/api/sessions/s_1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
