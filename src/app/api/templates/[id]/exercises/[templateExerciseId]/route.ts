import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateTemplateExerciseSchema } from "@/lib/validations/template";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; templateExerciseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: templateId, templateExerciseId } = await params;
  const template = await prisma.sessionTemplate.findFirst({
    where: { id: templateId, ownerId: session.user.id },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const templateExercise = await prisma.templateExercise.findFirst({
    where: { id: templateExerciseId, templateId },
  });

  if (!templateExercise) {
    return NextResponse.json(
      { error: "Template exercise not found" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const parsed = updateTemplateExerciseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.templateExercise.update({
      where: { id: templateExerciseId },
      data: {
        ...(parsed.data.order !== undefined && { order: parsed.data.order }),
        ...(parsed.data.defaultSets !== undefined && {
          defaultSets: parsed.data.defaultSets,
        }),
        ...(parsed.data.defaultReps !== undefined && {
          defaultReps: parsed.data.defaultReps,
        }),
        ...(parsed.data.defaultWeight !== undefined && {
          defaultWeight: parsed.data.defaultWeight,
        }),
        ...(parsed.data.defaultDurationSec !== undefined && {
          defaultDurationSec: parsed.data.defaultDurationSec,
        }),
      },
      include: { exercise: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update template exercise error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; templateExerciseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: templateId, templateExerciseId } = await params;
  const template = await prisma.sessionTemplate.findFirst({
    where: { id: templateId, ownerId: session.user.id },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const templateExercise = await prisma.templateExercise.findFirst({
    where: { id: templateExerciseId, templateId },
  });

  if (!templateExercise) {
    return NextResponse.json(
      { error: "Template exercise not found" },
      { status: 404 }
    );
  }

  await prisma.templateExercise.delete({ where: { id: templateExerciseId } });
  return NextResponse.json({ success: true });
}
