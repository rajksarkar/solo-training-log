import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addSessionExerciseSchema } from "@/lib/validations/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: sessionId } = await params;
  const s = await prisma.session.findFirst({
    where: { id: sessionId, ownerId: session.user.id },
  });

  if (!s) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = addSessionExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const sessionExercise = await prisma.sessionExercise.create({
      data: {
        sessionId,
        exerciseId: parsed.data.exerciseId,
        order: parsed.data.order,
        notes: parsed.data.notes ?? null,
      },
      include: { exercise: true },
    });

    return NextResponse.json(sessionExercise);
  } catch (err) {
    console.error("Add session exercise error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
