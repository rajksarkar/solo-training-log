import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, DELETE } from "@/app/api/templates/[id]/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

const params = Promise.resolve({ id: "tmpl_1" });

describe("GET /api/templates/[id]", () => {
  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost:3000/api/templates/tmpl_1");
    const res = await GET(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 if template not found", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.sessionTemplate.findFirst.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/templates/tmpl_1");
    const res = await GET(req, { params });
    expect(res.status).toBe(404);
  });

  it("returns template with exercises", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.sessionTemplate.findFirst.mockResolvedValue({
      id: "tmpl_1",
      title: "Push Day",
      exercises: [],
    } as never);

    const req = new Request("http://localhost:3000/api/templates/tmpl_1");
    const res = await GET(req, { params });
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/templates/[id]", () => {
  it("returns 404 if template not found", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.sessionTemplate.findFirst.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/templates/tmpl_1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(404);
  });

  it("deletes own template", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user_1", email: "t@t.com", name: "T" },
      expires: "2099-01-01",
    });
    mockPrisma.sessionTemplate.findFirst.mockResolvedValue({
      id: "tmpl_1",
      ownerId: "user_1",
    } as never);
    mockPrisma.sessionTemplate.delete.mockResolvedValue({} as never);

    const req = new Request("http://localhost:3000/api/templates/tmpl_1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
