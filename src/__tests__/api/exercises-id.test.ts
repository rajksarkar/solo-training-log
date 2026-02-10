import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "@/app/api/exercises/[id]/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

const params = Promise.resolve({ id: "ex_1" });

describe("PATCH /api/exercises/[id]", () => {
  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost:3000/api/exercises/ex_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 if exercise not found", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.exercise.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/exercises/ex_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 403 if exercise belongs to another user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: "ex_1",
      ownerId: "other_user",
      name: "Test",
      category: "strength",
    } as never);

    const req = new Request("http://localhost:3000/api/exercises/ex_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hack" }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(403);
  });

  it("allows updating global exercises (ownerId null)", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: "ex_1",
      ownerId: null,
      name: "Squat",
      category: "strength",
    } as never);
    mockPrisma.exercise.update.mockResolvedValue({
      id: "ex_1",
      name: "Back Squat",
    } as never);

    const req = new Request("http://localhost:3000/api/exercises/ex_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Back Squat" }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });

  it("updates own exercise", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: "ex_1",
      ownerId: "user_1",
      name: "Old",
      category: "strength",
    } as never);
    mockPrisma.exercise.update.mockResolvedValue({
      id: "ex_1",
      name: "New",
    } as never);

    const req = new Request("http://localhost:3000/api/exercises/ex_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New" }),
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/exercises/[id]", () => {
  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost:3000/api/exercises/ex_1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 if exercise not found", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.exercise.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/exercises/ex_1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns 403 for global exercises (ownerId null)", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: "ex_1",
      ownerId: null,
    } as never);

    const req = new Request("http://localhost:3000/api/exercises/ex_1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(403);
  });

  it("returns 403 for other user's exercises", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: "ex_1",
      ownerId: "other_user",
    } as never);

    const req = new Request("http://localhost:3000/api/exercises/ex_1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(403);
  });

  it("deletes own exercise", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: "ex_1",
      ownerId: "user_1",
    } as never);
    mockPrisma.exercise.delete.mockResolvedValue({} as never);

    const req = new Request("http://localhost:3000/api/exercises/ex_1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
