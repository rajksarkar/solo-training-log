import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; seId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId, seId } = await params;

  const s = await prisma.session.findFirst({
    where: { id: sessionId, ownerId: session.user.id },
  });

  if (!s) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { notes, order } = body;

    const updated = await prisma.sessionExercise.update({
      where: { id: seId },
      data: {
        ...(notes !== undefined && { notes }),
        ...(order !== undefined && { order }),
      },
      include: { exercise: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update session exercise error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; seId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId, seId } = await params;

  // Verify the session belongs to the user
  const s = await prisma.session.findFirst({
    where: { id: sessionId, ownerId: session.user.id },
  });

  if (!s) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Delete the session exercise (cascades to set logs)
  await prisma.sessionExercise.delete({
    where: { id: seId },
  });

  return NextResponse.json({ success: true });
}
