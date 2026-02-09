import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateExerciseSchema } from "@/lib/validations/exercise";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }
  if (exercise.ownerId && exercise.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.exercise.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.category !== undefined && { category: parsed.data.category }),
        ...(parsed.data.equipment !== undefined && { equipment: parsed.data.equipment }),
        ...(parsed.data.muscles !== undefined && { muscles: parsed.data.muscles }),
        ...(parsed.data.instructions !== undefined && { instructions: parsed.data.instructions }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update exercise error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }
  if (!exercise.ownerId || exercise.ownerId !== session.user.id) {
    return NextResponse.json(
      { error: "Can only delete your own custom exercises" },
      { status: 403 }
    );
  }

  await prisma.exercise.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
