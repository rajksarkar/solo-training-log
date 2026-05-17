#!/usr/bin/env node
// Push 4-week full-body DUP program — May 18 → Jun 14, 2026
// 4 sessions/week: Mon/Wed/Fri/Sat
// Replaces existing strength + conflicting cardio sessions in the date range

const API_BASE = 'https://solo-training-log.vercel.app';
const API_KEY = 'baban2016';

const HEADERS = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
};

async function api(method, path, body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

// ─────────────────────────────────────────────────────────────
// Exercise IDs (verified via /api/exercises)
// ─────────────────────────────────────────────────────────────
const EX = {
  warmup:           'cmp08c7yu0001jo044ucjq7ip',
  backSquat:        'cmlfbz1h60003yye920gbcav5',
  benchPress:       'cmlfbyyuz0001yye9t2ra84v9',
  cableRow:         'cmlfc0jol0027yye9vdzj9mzl',
  rdl:              'cmlfbzcwx000jyye9mgwdgg99',
  lateralRaise:     'cmlfc0m75002byye9rpg7g5d0',
  hangingLegRaise:  'cmlfc18w60037yye9clqa4aa4',
  calfRaise:        'cmlfbzyyi001dyye93f8n3yd0',
  latPulldown:      'cmlfc0igc0025yye9cbywjtmq',
  ohp:              'cmlfbz4si0007yye9hnchvmks',
  legPress:         'cmmziamc8001xg4rwrc8b8ygj',
  inclineDbPress:   'cmmzial2k000kg4rw9diepweo',
  lyingLegCurl:     'cmmzialrc001bg4rwt4js6uoh',
  seatedDbCurl:     'cmmziaoon0041g4rwp8pyjcev',
  hackSquat:        'cmlfc00aw001fyye93q86b8ej',
  chestSupportedRow:'cmmziaks70008g4rw8lwqhlrt',
  bulgarianSplitSquat:'cmlfbztet0015yye905zy3hj5',
  tricepPushdown:   'cmlfc0t5x002lyye9wm0zgu10',
  seatedCalfRaise:  'cmlfc05q8001nyye9codadrl2',
  cableFly:         'cmmziaon5003zg4rwor9zxian',
  facePull:         'cmlfc0kvh0029yye9oa9ct0gl',
};

// ─────────────────────────────────────────────────────────────
// Day blueprints (Week 1 weights — used as template defaults)
// Each exercise: {ex, sets, reps, weight, rpe, note}
// ─────────────────────────────────────────────────────────────
const DAYS = {
  D1: {
    title: 'D1 · Squat + Push (Strength)',
    exercises: [
      { ex: EX.warmup,          sets: 1, reps: null, weight: null, durationSec: 300, rpe: null, note: '5 min · joint mobility, light cardio, movement prep for squat/bench' },
      { ex: EX.backSquat,       sets: 3, reps: 5,    weight: 175,  rpe: 7, note: 'SS A1 · Rest 2 min → A2. Brace, depth to parallel.' },
      { ex: EX.benchPress,      sets: 3, reps: 6,    weight: 125,  rpe: 7, note: 'SS A2 · Rest 2 min → A1. Leg drive, controlled descent.' },
      { ex: EX.cableRow,        sets: 3, reps: 10,   weight: 140,  rpe: 7, note: 'SS B1 · Rest 90s. Squeeze shoulder blades.' },
      { ex: EX.rdl,             sets: 3, reps: 8,    weight: 185,  rpe: 7, note: 'SS B2 · Rest 90s. Hip hinge, hamstring stretch.' },
      { ex: EX.lateralRaise,    sets: 4, reps: 15,   weight: 20,   rpe: 7, note: 'SS C1 · Rest 60s. Cable preferred for constant tension.' },
      { ex: EX.hangingLegRaise, sets: 3, reps: 12,   weight: null, rpe: 7, note: 'SS C2 · Rest 60s. Bodyweight, no swing.' },
      { ex: EX.calfRaise,       sets: 4, reps: 12,   weight: 60,   rpe: 8, note: 'Standalone · Rest 60s. Full ROM, hold top 1s.' },
    ],
  },
  D2: {
    title: 'D2 · Hinge + Pull (Strength)',
    exercises: [
      { ex: EX.warmup,          sets: 1, reps: null, weight: null, durationSec: 300, rpe: null, note: '5 min · band pull-aparts, hip hinge mobility' },
      { ex: EX.latPulldown,     sets: 3, reps: 6,    weight: 140,  rpe: 8, note: 'SS A1 · Rest 2 min → A2. Pull to upper chest.' },
      { ex: EX.ohp,             sets: 3, reps: 6,    weight: 85,   rpe: 8, note: 'SS A2 · Rest 2 min → A1. Brace core, glutes squeezed.' },
      { ex: EX.legPress,        sets: 3, reps: 10,   weight: 240,  rpe: 7, note: 'SS B1 · Rest 90s. Don\'t lock out, control eccentric.' },
      { ex: EX.inclineDbPress,  sets: 3, reps: 10,   weight: 45,   rpe: 7, note: 'SS B2 · Rest 90s. Per dumbbell. 30-45° incline.' },
      { ex: EX.lyingLegCurl,    sets: 3, reps: 10,   weight: 110,  rpe: 7, note: 'SS C1 · Rest 60s. Squeeze at top, slow eccentric.' },
      { ex: EX.lateralRaise,    sets: 4, reps: 15,   weight: 20,   rpe: 7, note: 'SS C2 · Rest 60s. Cable or DB.' },
      { ex: EX.seatedDbCurl,    sets: 3, reps: 12,   weight: 22.5, rpe: 7, note: 'Standalone · Rest 60s. Per dumbbell. Supinate at top.' },
    ],
  },
  D3: {
    title: 'D3 · Squat + Push (Volume)',
    exercises: [
      { ex: EX.warmup,          sets: 1, reps: null, weight: null, durationSec: 300, rpe: null, note: '5 min · bodyweight squats, scapular activation' },
      { ex: EX.hackSquat,       sets: 3, reps: 8,    weight: 180,  rpe: 7, note: 'SS A1 · Rest 2 min → A2. Below parallel, drive through heels.' },
      { ex: EX.inclineDbPress,  sets: 3, reps: 10,   weight: 45,   rpe: 7, note: 'SS A2 · Rest 2 min → A1. Per dumbbell. Upper chest focus.' },
      { ex: EX.chestSupportedRow,sets: 3, reps: 10,  weight: 40,   rpe: 7, note: 'SS B1 · Rest 90s. Per dumbbell. Chest pinned, retract scaps.' },
      { ex: EX.bulgarianSplitSquat,sets: 3, reps: 8, weight: 30,   rpe: 8, note: 'SS B2 · Rest 90s. Per leg, per dumbbell. Rear foot elevated.' },
      { ex: EX.tricepPushdown,  sets: 3, reps: 12,   weight: 50,   rpe: 7, note: 'SS C1 · Rest 60s. Elbows pinned to sides.' },
      { ex: EX.hangingLegRaise, sets: 3, reps: 12,   weight: null, rpe: 7, note: 'SS C2 · Rest 60s. Controlled, no swing.' },
      { ex: EX.seatedCalfRaise, sets: 4, reps: 15,   weight: 90,   rpe: 8, note: 'Standalone · Rest 60s. Targets soleus.' },
    ],
  },
  D4: {
    title: 'D4 · Hinge + Pull (Volume)',
    exercises: [
      { ex: EX.warmup,          sets: 1, reps: null, weight: null, durationSec: 300, rpe: null, note: '5 min · hip mobility, band pull-aparts' },
      { ex: EX.rdl,             sets: 3, reps: 10,   weight: 175,  rpe: 7, note: 'SS A1 · Rest 2 min → A2. Lighter than D1, more reps.' },
      { ex: EX.chestSupportedRow,sets: 3, reps: 12,  weight: 35,   rpe: 7, note: 'SS A2 · Rest 2 min → A1. Per dumbbell. Volume bias.' },
      { ex: EX.cableFly,        sets: 3, reps: 12,   weight: 20,   rpe: 7, note: 'SS B1 · Rest 90s. Slight elbow bend, squeeze pecs.' },
      { ex: EX.lyingLegCurl,    sets: 3, reps: 12,   weight: 100,  rpe: 7, note: 'SS B2 · Rest 90s. Higher reps for hams.' },
      { ex: EX.facePull,        sets: 3, reps: 15,   weight: 40,   rpe: 7, note: 'SS C1 · Rest 60s. External rotate at end, rear delts.' },
      { ex: EX.seatedDbCurl,    sets: 3, reps: 12,   weight: 22.5, rpe: 7, note: 'SS C2 · Rest 60s. Per dumbbell.' },
      { ex: EX.lateralRaise,    sets: 4, reps: 15,   weight: 20,   rpe: 7, note: 'Standalone · Rest 60s. Cable or DB.' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// Weekly progression overlay
// Compounds: +1 rep W1→W2, +5lb W2→W3, deload W4
// Isolation: +1 rep W1→W2, +2.5lb W2→W3, deload W4
// ─────────────────────────────────────────────────────────────
function applyWeekProgression(blueprint, weekNum) {
  return blueprint.exercises.map((e) => {
    if (e.ex === EX.warmup) return e;
    const copy = { ...e };
    const isCompound = [EX.backSquat, EX.benchPress, EX.rdl, EX.latPulldown, EX.ohp, EX.legPress, EX.hackSquat].includes(e.ex);

    if (weekNum === 1) {
      // base
    } else if (weekNum === 2) {
      // +1 rep
      copy.reps = e.reps + 1;
      copy.rpe = Math.min(8, (e.rpe || 7) + 1);
    } else if (weekNum === 3) {
      // peak: reset reps, add load
      copy.reps = e.reps;
      copy.weight = e.weight === null ? null : (isCompound ? e.weight + 5 : e.weight + 2.5);
      copy.rpe = 8;
    } else if (weekNum === 4) {
      // deload: half sets, same weight
      copy.sets = Math.max(2, Math.ceil(e.sets / 2));
      copy.rpe = Math.max(6, (e.rpe || 7) - 1);
    }
    return copy;
  });
}

// ─────────────────────────────────────────────────────────────
// Date schedule
// ─────────────────────────────────────────────────────────────
const SCHEDULE = [
  // Week 1
  { date: '2026-05-18', day: 'D1', week: 1 },
  { date: '2026-05-20', day: 'D2', week: 1 },
  { date: '2026-05-22', day: 'D3', week: 1 },
  { date: '2026-05-23', day: 'D4', week: 1 },
  // Week 2
  { date: '2026-05-25', day: 'D1', week: 2 },
  { date: '2026-05-27', day: 'D2', week: 2 },
  { date: '2026-05-29', day: 'D3', week: 2 },
  { date: '2026-05-30', day: 'D4', week: 2 },
  // Week 3
  { date: '2026-06-01', day: 'D1', week: 3 },
  { date: '2026-06-03', day: 'D2', week: 3 },
  { date: '2026-06-05', day: 'D3', week: 3 },
  { date: '2026-06-06', day: 'D4', week: 3 },
  // Week 4 (Deload)
  { date: '2026-06-08', day: 'D1', week: 4 },
  { date: '2026-06-10', day: 'D2', week: 4 },
  { date: '2026-06-12', day: 'D3', week: 4 },
  { date: '2026-06-13', day: 'D4', week: 4 },
];

// Existing session IDs to delete (from earlier query)
const SESSIONS_TO_DELETE = [
  // Week 3 (May 18-23)
  'cmoq85vgs00kzi504cw1keivk', // May 18 Cardio Zone 2 — conflicts with new D1
  'cmoq85rwt00hhi504tmlqusfa', // May 20 Lower Heavy
  'cmoq85tyu00j9i504x4tjby7s', // May 21 Upper Heavy
  'cmoq85w1q00l5i504lg5inwfo', // May 22 Lower Volume
  'cmoq85xjy00mxi5042s3kljqf', // May 23 Upper Volume
  // Week 4 (May 25-30)
  'cmoq8601a00pbi504h1lo83s7', // May 25 Lower Heavy
  'cmoq861ju00r3i5048s4257ms', // May 26 Upper Heavy
  'cmoq8637400sti504e8occz9d', // May 27 Cardio Zone 2 — conflicts with new D2
  'cmoq863s000szi504vfslv88j', // May 29 Lower Volume
  'cmoq865ab00uri5042tw35b5t', // May 30 Upper Volume
  // Week 5 (Jun 1-6)
  'cmoq867v600x5i504v38j72bu', // Jun 1 Lower Heavy
  'cmoq869e900yxi504qyi68mtn', // Jun 2 Upper Heavy
  'cmoq86bdz010ni504hr3psbga', // Jun 3 Cardio Zone 2 — conflicts
  'cmoq86byv010ti504xe63iflb', // Jun 5 Lower Volume
  'cmoq86djz012li504hka9hkh7', // Jun 6 Upper Volume
  // Week 6 (Jun 8-13)
  'cmoq86gik014zi504r3u40elp', // Jun 8 Lower Heavy
  'cmoq86i08016ri504tb6vwv4k', // Jun 9 Upper Heavy
  'cmoq86jw9018hi504fhvfp9hs', // Jun 10 Cardio Zone 2 — conflicts
  'cmoq86kmy018ni5040r15kc0k', // Jun 12 Lower Volume
  'cmoq86m7c01afi5040glmxl51', // Jun 13 Upper Volume
];
// Kept: Sun Cardio sessions (May 17, May 24, May 31, Jun 7, Jun 14) — rest days

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('Push 4-Week Full-Body DUP Program → Solo Training Log');
  console.log('═══════════════════════════════════════════════════════\n');

  // Step 1: Delete conflicting sessions
  console.log(`[1/4] Deleting ${SESSIONS_TO_DELETE.length} conflicting sessions…`);
  let deleted = 0;
  for (const id of SESSIONS_TO_DELETE) {
    try {
      await api('DELETE', `/api/sessions/${id}`);
      deleted++;
    } catch (e) {
      console.warn(`  ⚠ Failed to delete ${id}: ${e.message}`);
    }
  }
  console.log(`     ✓ Deleted ${deleted}/${SESSIONS_TO_DELETE.length}\n`);

  // Step 2: Create 4 templates (one per day type)
  console.log('[2/4] Creating 4 day templates…');
  const templateIds = {};
  for (const [key, blueprint] of Object.entries(DAYS)) {
    const tmpl = await api('POST', '/api/templates', {
      title: blueprint.title,
      category: 'strength',
      notes: '4-Week Full-Body DUP — Built by Strength Coach (2026-05-16)',
    });
    templateIds[key] = tmpl.id;
    // Add exercises
    let order = 0;
    for (const e of blueprint.exercises) {
      await api('POST', `/api/templates/${tmpl.id}/exercises`, {
        exerciseId: e.ex,
        order: order++,
        defaultSets: e.sets,
        defaultReps: e.reps ?? undefined,
        defaultWeight: e.weight ?? undefined,
        defaultDurationSec: e.durationSec ?? undefined,
        notes: e.note,
      });
    }
    console.log(`     ✓ ${key}: ${blueprint.title}  (${blueprint.exercises.length} exercises)`);
  }
  console.log();

  // Step 3 + 4: Create 16 sessions + seed setLogs with week-specific weights
  console.log('[3/4] Creating 16 sessions with week-specific weights…');
  for (const slot of SCHEDULE) {
    const blueprint = DAYS[slot.day];
    const exercises = applyWeekProgression(blueprint, slot.week);

    const titleSuffix = slot.week === 4 ? ' [DELOAD]' : '';
    const session = await api('POST', '/api/sessions', {
      title: `${blueprint.title.replace(/^D\d · /, '')} (Wk${slot.week})${titleSuffix}`,
      category: 'strength',
      date: slot.date,
      templateId: templateIds[slot.day],
      notes: `Wk${slot.week} of 4 | Full-Body DUP | ${slot.day} | Built ${new Date().toISOString().slice(0, 10)} | Antagonist supersets, ~50-55 min target`,
    });

    // Get session detail to retrieve sessionExerciseIds
    const detail = await api('GET', `/api/sessions/${session.id}`);
    const sessionExercises = detail.exercises || [];

    // Build setLogs array
    const logs = [];
    for (const se of sessionExercises) {
      // Match SessionExercise to blueprint by exerciseId AND order (some exercises repeat across days)
      const planned = exercises.find((e, idx) => e.ex === se.exerciseId && idx === se.order);
      if (!planned) continue;

      const sets = planned.sets;
      for (let i = 0; i < sets; i++) {
        const log = {
          sessionExerciseId: se.id,
          setIndex: i,
          completed: false,
        };
        if (planned.reps !== null && planned.reps !== undefined) log.reps = planned.reps;
        if (planned.weight !== null && planned.weight !== undefined) {
          log.weight = planned.weight;
          log.unit = 'lb';
        }
        if (planned.durationSec) log.durationSec = planned.durationSec;
        if (planned.rpe !== null && planned.rpe !== undefined) log.rpe = Math.round(planned.rpe);
        logs.push(log);
      }
    }

    await api('POST', `/api/sessions/${session.id}/logs`, { logs });
    console.log(`     ✓ ${slot.date} · ${slot.day} Wk${slot.week}${titleSuffix}  (${logs.length} placeholder sets)`);
  }
  console.log();

  // Step 4: Done
  console.log('[4/4] ✓ All 16 sessions scheduled and seeded.\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Program live: https://solo-training-log.vercel.app');
  console.log('═══════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('\n❌ Push failed:', err.message);
  process.exit(1);
});
