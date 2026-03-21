import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bodyCompositionSchema } from "@/lib/validations/body-composition";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.bodyComposition.findMany({
    where: { ownerId: session.user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bodyCompositionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const dateObj = new Date(parsed.data.date + "T00:00:00.000Z");

    const entry = await prisma.bodyComposition.upsert({
      where: {
        ownerId_date_scanType: {
          ownerId: session.user.id,
          date: dateObj,
          scanType: parsed.data.scanType,
        },
      },
      update: {
        weight: parsed.data.weight,
        bodyFatPct: parsed.data.bodyFatPct,
        fatMass: parsed.data.fatMass ?? null,
        leanMass: parsed.data.leanMass ?? null,
        visceralFat: parsed.data.visceralFat ?? null,
        notes: parsed.data.notes ?? null,
      },
      create: {
        ownerId: session.user.id,
        date: dateObj,
        scanType: parsed.data.scanType,
        weight: parsed.data.weight,
        bodyFatPct: parsed.data.bodyFatPct,
        fatMass: parsed.data.fatMass ?? null,
        leanMass: parsed.data.leanMass ?? null,
        visceralFat: parsed.data.visceralFat ?? null,
        notes: parsed.data.notes ?? null,
      },
    });

    return NextResponse.json(entry);
  } catch (err) {
    console.error("Body composition upsert error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
