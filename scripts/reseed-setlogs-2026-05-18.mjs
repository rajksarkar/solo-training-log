#!/usr/bin/env node
// Re-seed SetLogs for the 16 sessions May 18 → Jun 13.
// Idempotent: bulk upsert keys on (sessionExerciseId, setIndex).

const API_BASE = 'https://solo-training-log.vercel.app';
const API_KEY = 'baban2016';
const HEADERS = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };

async function api(method, path, body) {
  const res = await fetch(API_BASE + path, {
    method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

const EX = {
  warmup:'cmp08c7yu0001jo044ucjq7ip', backSquat:'cmlfbz1h60003yye920gbcav5',
  benchPress:'cmlfbyyuz0001yye9t2ra84v9', cableRow:'cmlfc0jol0027yye9vdzj9mzl',
  rdl:'cmlfbzcwx000jyye9mgwdgg99', lateralRaise:'cmlfc0m75002byye9rpg7g5d0',
  hangingLegRaise:'cmlfc18w60037yye9clqa4aa4', calfRaise:'cmlfbzyyi001dyye93f8n3yd0',
  latPulldown:'cmlfc0igc0025yye9cbywjtmq', ohp:'cmlfbz4si0007yye9hnchvmks',
  legPress:'cmmziamc8001xg4rwrc8b8ygj', inclineDbPress:'cmmzial2k000kg4rw9diepweo',
  lyingLegCurl:'cmmzialrc001bg4rwt4js6uoh', seatedDbCurl:'cmmziaoon0041g4rwp8pyjcev',
  hackSquat:'cmlfc00aw001fyye93q86b8ej', chestSupportedRow:'cmmziaks70008g4rw8lwqhlrt',
  bulgarianSplitSquat:'cmlfbztet0015yye905zy3hj5', tricepPushdown:'cmlfc0t5x002lyye9wm0zgu10',
  seatedCalfRaise:'cmlfc05q8001nyye9codadrl2', cableFly:'cmmziaon5003zg4rwor9zxian',
  facePull:'cmlfc0kvh0029yye9oa9ct0gl',
};

const DAYS = {
  D1: [
    { ex: EX.warmup,          sets: 1, reps: null, weight: null, durationSec: 300, rpe: null },
    { ex: EX.backSquat,       sets: 3, reps: 5,    weight: 175,  rpe: 7 },
    { ex: EX.benchPress,      sets: 3, reps: 6,    weight: 125,  rpe: 7 },
    { ex: EX.cableRow,        sets: 3, reps: 10,   weight: 140,  rpe: 7 },
    { ex: EX.rdl,             sets: 3, reps: 8,    weight: 185,  rpe: 7 },
    { ex: EX.lateralRaise,    sets: 4, reps: 15,   weight: 20,   rpe: 7 },
    { ex: EX.hangingLegRaise, sets: 3, reps: 12,   weight: null, rpe: 7 },
    { ex: EX.calfRaise,       sets: 4, reps: 12,   weight: 60,   rpe: 8 },
  ],
  D2: [
    { ex: EX.warmup,          sets: 1, reps: null, weight: null, durationSec: 300, rpe: null },
    { ex: EX.latPulldown,     sets: 3, reps: 6,    weight: 140,  rpe: 8 },
    { ex: EX.ohp,             sets: 3, reps: 6,    weight: 85,   rpe: 8 },
    { ex: EX.legPress,        sets: 3, reps: 10,   weight: 240,  rpe: 7 },
    { ex: EX.inclineDbPress,  sets: 3, reps: 10,   weight: 45,   rpe: 7 },
    { ex: EX.lyingLegCurl,    sets: 3, reps: 10,   weight: 110,  rpe: 7 },
    { ex: EX.lateralRaise,    sets: 4, reps: 15,   weight: 20,   rpe: 7 },
    { ex: EX.seatedDbCurl,    sets: 3, reps: 12,   weight: 22.5, rpe: 7 },
  ],
  D3: [
    { ex: EX.warmup,          sets: 1, reps: null, weight: null, durationSec: 300, rpe: null },
    { ex: EX.hackSquat,       sets: 3, reps: 8,    weight: 180,  rpe: 7 },
    { ex: EX.inclineDbPress,  sets: 3, reps: 10,   weight: 45,   rpe: 7 },
    { ex: EX.chestSupportedRow,sets: 3, reps: 10,  weight: 40,   rpe: 7 },
    { ex: EX.bulgarianSplitSquat,sets: 3, reps: 8, weight: 30,   rpe: 8 },
    { ex: EX.tricepPushdown,  sets: 3, reps: 12,   weight: 50,   rpe: 7 },
    { ex: EX.hangingLegRaise, sets: 3, reps: 12,   weight: null, rpe: 7 },
    { ex: EX.seatedCalfRaise, sets: 4, reps: 15,   weight: 90,   rpe: 8 },
  ],
  D4: [
    { ex: EX.warmup,          sets: 1, reps: null, weight: null, durationSec: 300, rpe: null },
    { ex: EX.rdl,             sets: 3, reps: 10,   weight: 175,  rpe: 7 },
    { ex: EX.chestSupportedRow,sets: 3, reps: 12,  weight: 35,   rpe: 7 },
    { ex: EX.cableFly,        sets: 3, reps: 12,   weight: 20,   rpe: 7 },
    { ex: EX.lyingLegCurl,    sets: 3, reps: 12,   weight: 100,  rpe: 7 },
    { ex: EX.facePull,        sets: 3, reps: 15,   weight: 40,   rpe: 7 },
    { ex: EX.seatedDbCurl,    sets: 3, reps: 12,   weight: 22.5, rpe: 7 },
    { ex: EX.lateralRaise,    sets: 4, reps: 15,   weight: 20,   rpe: 7 },
  ],
};

function applyWeek(blueprint, weekNum) {
  return blueprint.map((e) => {
    if (e.ex === EX.warmup) return e;
    const isCompound = [EX.backSquat, EX.benchPress, EX.rdl, EX.latPulldown, EX.ohp, EX.legPress, EX.hackSquat].includes(e.ex);
    const c = { ...e };
    if (weekNum === 2) {
      c.reps = e.reps + 1;
      c.rpe = Math.min(8, (e.rpe || 7) + 1);
    } else if (weekNum === 3) {
      c.weight = e.weight === null ? null : (isCompound ? e.weight + 5 : e.weight + 2.5);
      c.rpe = 8;
    } else if (weekNum === 4) {
      c.sets = Math.max(2, Math.ceil(e.sets / 2));
      c.rpe = Math.max(6, (e.rpe || 7) - 1);
    }
    return c;
  });
}

const SCHEDULE = [
  { date: '2026-05-18', day: 'D1', week: 1 }, { date: '2026-05-20', day: 'D2', week: 1 },
  { date: '2026-05-22', day: 'D3', week: 1 }, { date: '2026-05-23', day: 'D4', week: 1 },
  { date: '2026-05-25', day: 'D1', week: 2 }, { date: '2026-05-27', day: 'D2', week: 2 },
  { date: '2026-05-29', day: 'D3', week: 2 }, { date: '2026-05-30', day: 'D4', week: 2 },
  { date: '2026-06-01', day: 'D1', week: 3 }, { date: '2026-06-03', day: 'D2', week: 3 },
  { date: '2026-06-05', day: 'D3', week: 3 }, { date: '2026-06-06', day: 'D4', week: 3 },
  { date: '2026-06-08', day: 'D1', week: 4 }, { date: '2026-06-10', day: 'D2', week: 4 },
  { date: '2026-06-12', day: 'D3', week: 4 }, { date: '2026-06-13', day: 'D4', week: 4 },
];

async function main() {
  console.log('Re-seeding SetLogs for 16 sessions…\n');
  const sessions = await api('GET', '/api/sessions?from=2026-05-18&to=2026-06-13');
  const byDate = Object.fromEntries(sessions.map((s) => [s.date.slice(0, 10), s]));

  let totalSeeded = 0;
  for (const slot of SCHEDULE) {
    const session = byDate[slot.date];
    if (!session) { console.warn(`  ⚠ No session on ${slot.date}`); continue; }

    const planned = applyWeek(DAYS[slot.day], slot.week);
    const logs = [];
    for (const se of session.exercises) {
      // Match by exerciseId only (each exercise unique per day blueprint)
      const p = planned.find((e) => e.ex === se.exerciseId);
      if (!p) continue;
      for (let i = 0; i < p.sets; i++) {
        const log = { sessionExerciseId: se.id, setIndex: i, completed: false };
        if (p.reps != null) log.reps = p.reps;
        if (p.weight != null) { log.weight = p.weight; log.unit = 'lb'; }
        if (p.durationSec) log.durationSec = p.durationSec;
        if (p.rpe != null) log.rpe = Math.round(p.rpe);
        logs.push(log);
      }
    }

    await api('POST', `/api/sessions/${session.id}/logs`, { logs });
    console.log(`  ✓ ${slot.date} · ${slot.day} Wk${slot.week}  → ${logs.length} sets seeded`);
    totalSeeded += logs.length;
  }

  console.log(`\n✓ Re-seeded ${totalSeeded} total sets across 16 sessions.`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
