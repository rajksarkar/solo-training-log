import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSessionSchema } from "@/lib/validations/session";

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
        include: { exercise: true },
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
          exercises: { orderBy: { order: "asc" } },
        },
      });
      if (template) {
        exercisesData = template.exercises.map((te) => ({
          exerciseId: te.exerciseId,
          order: te.order,
          notes: te.defaultReps
            ? `${te.defaultSets ?? ""}x${te.defaultReps} @ ${te.defaultWeight ?? ""}`
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
