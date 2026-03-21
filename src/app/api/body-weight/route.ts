import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bodyWeightSchema } from "@/lib/validations/body-weight";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "90", 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const entries = await prisma.bodyWeight.findMany({
    where: {
      ownerId: session.user.id,
      date: { gte: since },
    },
    orderBy: { date: "desc" },
  });

  // Compute stats
  const current = entries.length > 0 ? entries[0] : null;

  const now = new Date();

  // 7-day average
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const last7 = entries.filter((e) => new Date(e.date) >= sevenDaysAgo);
  const sevenDayAvg =
    last7.length > 0
      ? Math.round((last7.reduce((s, e) => s + e.weight, 0) / last7.length) * 10) / 10
      : null;

  // 30-day average
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30 = entries.filter((e) => new Date(e.date) >= thirtyDaysAgo);
  const thirtyDayAvg =
    last30.length > 0
      ? Math.round((last30.reduce((s, e) => s + e.weight, 0) / last30.length) * 10) / 10
      : null;

  // Weekly change: this week avg - last week avg
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const thisWeekEntries = entries.filter((e) => new Date(e.date) >= startOfThisWeek);
  const lastWeekEntries = entries.filter(
    (e) => new Date(e.date) >= startOfLastWeek && new Date(e.date) < startOfThisWeek
  );

  let weeklyChange: number | null = null;
  if (thisWeekEntries.length > 0 && lastWeekEntries.length > 0) {
    const thisWeekAvg =
      thisWeekEntries.reduce((s, e) => s + e.weight, 0) / thisWeekEntries.length;
    const lastWeekAvg =
      lastWeekEntries.reduce((s, e) => s + e.weight, 0) / lastWeekEntries.length;
    weeklyChange = Math.round((thisWeekAvg - lastWeekAvg) * 10) / 10;
  }

  return NextResponse.json({
    entries,
    stats: {
      current: current ? { weight: current.weight, date: current.date } : null,
      sevenDayAvg,
      thirtyDayAvg,
      weeklyChange,
    },
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bodyWeightSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const dateObj = new Date(parsed.data.date + "T00:00:00.000Z");

    const entry = await prisma.bodyWeight.upsert({
      where: {
        ownerId_date: {
          ownerId: session.user.id,
          date: dateObj,
        },
      },
      update: {
        weight: parsed.data.weight,
        unit: parsed.data.unit,
        notes: parsed.data.notes ?? null,
      },
      create: {
        ownerId: session.user.id,
        date: dateObj,
        weight: parsed.data.weight,
        unit: parsed.data.unit,
        notes: parsed.data.notes ?? null,
      },
    });

    return NextResponse.json(entry);
  } catch (err) {
    console.error("Body weight upsert error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
