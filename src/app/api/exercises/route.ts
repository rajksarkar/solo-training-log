import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createExerciseSchema } from "@/lib/validations/exercise";
import type { ExerciseCategory } from "@prisma/client";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase() ?? "";
    const category = searchParams.get("category") as ExerciseCategory | null;

    const baseWhere = {
      OR: [
        { ownerId: null as string | null },
        { ownerId: session.user.id },
      ],
      ...(category && { category }),
    };

    const exercises = q
      ? await prisma.exercise.findMany({
          where: {
            AND: [
              baseWhere,
              { name: { contains: q } },
            ],
          },
          orderBy: { name: "asc" },
        })
      : await prisma.exercise.findMany({
          where: baseWhere,
          orderBy: { name: "asc" },
        });

    return NextResponse.json(exercises);
  } catch (err) {
    console.error("GET /api/exercises error:", err);
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const exercise = await prisma.exercise.create({
      data: {
        ownerId: session.user.id,
        name: parsed.data.name,
        category: parsed.data.category,
        equipment: parsed.data.equipment ?? [],
        muscles: parsed.data.muscles ?? [],
        instructions: parsed.data.instructions ?? "",
        youtubeId: parsed.data.youtubeId ?? null,
      },
    });

    return NextResponse.json(exercise);
  } catch (err) {
    console.error("Create exercise error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
