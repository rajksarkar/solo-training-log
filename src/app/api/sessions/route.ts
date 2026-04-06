import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSessionSchema } from "@/lib/validations/session";
import { getExerciseSortPriority } from "@/lib/exercise-ordering";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: { ownerId: string; date?: { gte?: Date; lte?: Date } } = {
    ownerId: session.user.id,
  };

  if (from) {
    where.date = { ...where.date, gte: new Date(from) };
  }
  if (to) {
    where.date = { ...where.date, lte: new Date(to) };
  }

  const sessions = await prisma.session.findMany({
    where,
    include: {
      exercises: {
        include: {
          exercise: true,
          setLogs: { orderBy: { setIndex: "asc" } },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const templateId = parsed.data.templateId;
    let exercisesData: { exerciseId: string; order: number; notes: string | null }[] = [];

    if (templateId) {
      const template = await prisma.sessionTemplate.findFirst({
        where: { id: templateId, ownerId: session.user.id },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: { select: { name: true } } },
          },
        },
      });
      if (template) {
        // Sort by scientific exercise priority: compound lower → compound upper → isolation
        const sorted = [...template.exercises].sort((a, b) =>
          getExerciseSortPriority(a.exercise.name) - getExerciseSortPriority(b.exercise.name)
        );
        exercisesData = sorted.map((te, idx) => ({
          exerciseId: te.exerciseId,
          order: idx,
          notes: te.defaultReps
            ? `${te.defaultSets ?? ""}×${te.defaultReps}${te.defaultWeight ? ` @ ${te.defaultWeight} lb` : ""}`
            : te.defaultDurationSec
              ? `${te.defaultDurationSec}s`
              : null,
        }));
      }
    }

    const newSession = await prisma.session.create({
      data: {
        ownerId: session.user.id,
        title: parsed.data.title,
        category: parsed.data.category,
        date: new Date(parsed.data.date),
        notes: parsed.data.notes ?? undefined,
        templateId: templateId ?? undefined,
        exercises: exercisesData.length
          ? {
              create: exercisesData,
            }
          : undefined,
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(newSession);
  } catch (err) {
    console.error("Create session error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
