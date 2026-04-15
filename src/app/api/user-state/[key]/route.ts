import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;

  const record = await prisma.userState.findUnique({
    where: { ownerId_key: { ownerId: session.user.id, key } },
  });

  if (!record) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({ data: record.data });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  const body = await request.json();

  const record = await prisma.userState.upsert({
    where: { ownerId_key: { ownerId: session.user.id, key } },
    create: {
      ownerId: session.user.id,
      key,
      data: body.data,
    },
    update: {
      data: body.data,
    },
  });

  return NextResponse.json({ data: record.data });
}
