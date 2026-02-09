import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addTemplateExerciseSchema } from "@/lib/validations/template";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: templateId } = await params;
  const template = await prisma.sessionTemplate.findFirst({
    where: { id: templateId, ownerId: session.user.id },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = addTemplateExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const templateExercise = await prisma.templateExercise.create({
      data: {
        templateId,
        exerciseId: parsed.data.exerciseId,
        order: parsed.data.order,
        defaultSets: parsed.data.defaultSets ?? null,
        defaultReps: parsed.data.defaultReps ?? null,
        defaultWeight: parsed.data.defaultWeight ?? null,
        defaultDurationSec: parsed.data.defaultDurationSec ?? null,
      },
      include: { exercise: true },
    });

    return NextResponse.json(templateExercise);
  } catch (err) {
    console.error("Add template exercise error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
