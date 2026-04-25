#!/usr/bin/env node
// Ported from weekly-report/n8n-workflow.json. Fetches this week's + last week's
// sessions, PRs, and exercises from the Solo Training Log API and writes an HTML
// report to weekly-report/ and ~/Desktop/.

import { writeFile, mkdir, rm, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { homedir, tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

// Load env files in order (later wins): shared Gmail creds, then local override.
await loadEnv("/Users/rsarkar/snowflake-data-explorer/.env");
await loadEnv(join(SCRIPT_DIR, ".env"));

const API_BASE = process.env.STL_API_BASE ?? "https://solo-training-log.vercel.app/api";
const API_KEY = process.env.STL_API_KEY ?? "baban2016";
const REPO_DIR = process.env.STL_REPO_DIR ?? "/Users/rsarkar/solo-training-log";
const GMAIL_USER = (process.env.GMAIL_USER ?? "").trim();
// Google displays app passwords as "xxxx yyyy zzzz wwww" for readability;
// SMTP AUTH wants the raw 16 chars.
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");
const SMTP_HOST = process.env.SMTP_HOST ?? "smtp.gmail.com";
const SMTP_PORT = process.env.SMTP_PORT ?? "587";
const REPORT_EMAIL = process.env.REPORT_EMAIL ?? "raj.sarkar@gmail.com";

// Volume landmarks per muscle (Renaissance Periodization: Israetel et al.).
// Mirrors src/lib/constants.ts so the report matches the in-app view.
const VOLUME_LANDMARKS = {
  chest:      { mev: 10, mav: 18, mrv: 22 },
  back:       { mev: 10, mav: 18, mrv: 22 },
  shoulders:  { mev: 8,  mav: 16, mrv: 22 },
  quads:      { mev: 8,  mav: 16, mrv: 20 },
  hamstrings: { mev: 6,  mav: 12, mrv: 16 },
  biceps:     { mev: 6,  mav: 14, mrv: 20 },
  triceps:    { mev: 6,  mav: 12, mrv: 18 },
  glutes:     { mev: 4,  mav: 12, mrv: 16 },
  calves:     { mev: 8,  mav: 16, mrv: 20 },
  core:       { mev: 0,  mav: 16, mrv: 20 },
};

const STRENGTH_CATEGORIES = new Set(["strength", "plyometrics"]);

function normalizeMuscle(raw) {
  const m = String(raw).toLowerCase().trim();
  if (m === "forearms") return null;
  if (["lats", "traps", "upper back", "lower back", "rhomboids"].includes(m)) return "back";
  if (m === "quadriceps") return "quads";
  if (["rear delts", "front delts", "side delts", "lateral delts", "anterior delts", "posterior delts", "deltoids", "delts"].includes(m)) return "shoulders";
  if (["abs", "obliques", "abdominals"].includes(m)) return "core";
  if (["pecs", "pectorals", "upper chest", "lower chest"].includes(m)) return "chest";
  if (m === "hams") return "hamstrings";
  if (["glute", "gluteus maximus", "gluteus medius"].includes(m)) return "glutes";
  const known = ["chest", "back", "shoulders", "quads", "hamstrings", "biceps", "triceps", "glutes", "calves", "core"];
  return known.includes(m) ? m : m;
}

// Score a muscle's weekly set count against MEV/MAV/MRV landmarks. Peaks at
// MAV (sweet spot), drops on either side of the productive range.
function scoreMuscleVolume(sets, mev, mav, mrv) {
  if (sets <= 0) return mev === 0 ? 5 : 0;
  if (mev > 0 && sets <= mev) return Math.round((sets / mev) * 5 * 10) / 10;
  if (sets <= mav) {
    const range = Math.max(1, mav - mev);
    return Math.round((5 + ((sets - mev) / range) * 5) * 10) / 10;
  }
  if (sets <= mrv) {
    const range = Math.max(1, mrv - mav);
    return Math.round((10 - ((sets - mav) / range) * 2) * 10) / 10;
  }
  // Overshoot: drops from 8 → 0 by the time we hit 1.5× MRV.
  const overshoot = (sets - mrv) / Math.max(1, mrv * 0.5);
  return Math.round(Math.max(0, 8 - overshoot * 8) * 10) / 10;
}

function scoreLabel(score) {
  if (score >= 8.5) return "Optimal";
  if (score >= 6.5) return "Productive";
  if (score >= 4) return "Under";
  if (score > 0) return "Far below";
  return "None";
}

function scoreColor(score) {
  if (score >= 8.5) return "#15803D"; // green
  if (score >= 6.5) return "#B8880E"; // gold
  if (score >= 4) return "#D97706";   // amber
  return "#B91C1C";                   // red
}

function computeVolumeScores(sessions) {
  const muscleSets = new Map();
  for (const s of sessions) {
    if (!STRENGTH_CATEGORIES.has(s.category)) continue;
    for (const ex of s.exercises ?? []) {
      const completed = (ex.setLogs ?? []).filter((l) => l.completed).length;
      if (completed === 0) continue;
      const raw = Array.isArray(ex.exercise?.muscles) ? ex.exercise.muscles : [];
      for (const r of raw) {
        const m = normalizeMuscle(r);
        if (!m) continue;
        muscleSets.set(m, (muscleSets.get(m) ?? 0) + completed);
      }
    }
  }

  // Include every major muscle group so under-trained ones surface explicitly
  // — a muscle with 0 sets shows as "0 / mrv" instead of being hidden.
  const perMuscle = Object.entries(VOLUME_LANDMARKS).map(([muscle, lm]) => {
    const sets = muscleSets.get(muscle) ?? 0;
    return {
      muscle,
      sets,
      mev: lm.mev,
      mav: lm.mav,
      mrv: lm.mrv,
      score: scoreMuscleVolume(sets, lm.mev, lm.mav, lm.mrv),
    };
  });
  perMuscle.sort((a, b) => b.sets - a.sets);

  const overall = perMuscle.length
    ? Math.round((perMuscle.reduce((sum, p) => sum + p.score, 0) / perMuscle.length) * 10) / 10
    : 0;

  return { perMuscle, overall };
}

async function loadEnv(path) {
  let text;
  try {
    text = await readFile(path, "utf8");
  } catch {
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\s*export\s+/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mondayOf(d) {
  const copy = new Date(d);
  const dow = copy.getDay();
  const delta = dow === 0 ? -6 : 1 - dow;
  copy.setDate(copy.getDate() + delta);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { "X-API-Key": API_KEY } });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

function weekStats(sessions) {
  let totalSets = 0, totalReps = 0, totalVol = 0, strength = 0, cardio = 0;
  const sessionDetails = [];
  for (const s of sessions) {
    const date = s.date.slice(0, 10);
    if (["strength", "plyometrics"].includes(s.category)) strength++;
    else cardio++;
    let sSets = 0, sReps = 0, sVol = 0;
    const exList = [];
    for (const ex of s.exercises ?? []) {
      const setsInfo = [];
      for (const log of ex.setLogs ?? []) {
        if (!log.completed) continue;
        const r = log.reps || 0;
        const w = log.weight || 0;
        sSets++;
        sReps += r;
        if (w > 0) {
          sVol += r * w;
          setsInfo.push(`${r}&times;${w}lb`);
        } else if (r > 0) {
          setsInfo.push(`${r} reps`);
        }
      }
      if (setsInfo.length) exList.push({ name: ex.exercise.name, sets: setsInfo.join(" | ") });
    }
    totalSets += sSets; totalReps += sReps; totalVol += sVol;
    sessionDetails.push({ date, title: s.title, category: s.category, sets: sSets, reps: sReps, volume: sVol, exercises: exList });
  }
  return { strength, cardio, totalSets, totalReps, totalVol, sessions: sessionDetails };
}

function buildHtml({ weekRange, dateStr, tw, lw, prsHit, top10, volDelta, repsDelta, volumeScores }) {
  const deltaClass = (v) => (v > 0 ? "up" : v < 0 ? "down" : "flat");
  const deltaSign = (v) => (v > 0 ? "+" : "");

  const sessionCards = tw.sessions
    .map((s) => {
      const d = new Date(s.date + "T12:00:00");
      const dayStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const catClass = ["strength", "plyometrics"].includes(s.category) ? "strength" : "cardio";
      const exRows = s.exercises
        .map((e) => `<div class="exercise-row"><span class="ex-name">${e.name}</span><span class="ex-sets">${e.sets}</span></div>`)
        .join("");
      return `<div class="card">
  <div class="session-header"><span class="session-title">${s.title}</span><span class="session-date">${dayStr}</span></div>
  <div class="session-meta"><span class="category-badge ${catClass}">${s.category}</span> &nbsp; ${s.sets} sets · ${s.reps} reps · ${s.volume.toLocaleString()} lb</div>
  ${exRows}
</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Weekly Training Report — ${weekRange}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #FFFFFF; color: #111827; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; max-width: 720px; margin: 0 auto; }
  h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; color: #0B0B0F; }
  h2 { font-size: 16px; font-weight: 700; color: #B8880E; text-transform: uppercase; letter-spacing: 1.5px; margin: 28px 0 12px; }
  .subtitle { font-size: 13px; color: #6B7280; margin-bottom: 24px; }
  .card { background: #FAFAFA; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
  .stat { background: #FAFAFA; border: 1px solid #E5E7EB; border-radius: 12px; padding: 14px; text-align: center; }
  .stat-value { font-size: 22px; font-weight: 800; color: #0B0B0F; }
  .stat-value.gold { color: #B8880E; }
  .stat-label { font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .delta { font-size: 11px; font-weight: 600; margin-top: 2px; }
  .delta.up { color: #15803D; }
  .delta.down { color: #B91C1C; }
  .delta.flat { color: #6B7280; }
  .session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .session-title { font-weight: 700; font-size: 15px; color: #0B0B0F; }
  .session-date { font-size: 12px; color: #6B7280; }
  .session-meta { font-size: 12px; color: #6B7280; margin-bottom: 8px; }
  .exercise-row { display: flex; justify-content: space-between; align-items: baseline; padding: 6px 0; border-bottom: 1px solid #F0F0F2; font-size: 13px; }
  .exercise-row:last-child { border-bottom: none; }
  .ex-name { color: #374151; flex-shrink: 0; max-width: 45%; }
  .ex-sets { color: #B8880E; font-weight: 500; text-align: right; font-size: 12px; }
  .pr-badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(184,136,14,0.12); color: #8A6408; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; margin: 3px 4px 3px 0; }
  .pr-list { display: flex; flex-wrap: wrap; gap: 4px; }
  .top-pr-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #F0F0F2; font-size: 13px; }
  .top-pr-row:last-child { border-bottom: none; }
  .top-pr-rank { color: #6B7280; width: 24px; }
  .top-pr-name { color: #374151; flex: 1; }
  .top-pr-val { color: #B8880E; font-weight: 600; }
  .injury-note { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #991B1B; margin-top: 8px; }
  .injury-note strong { color: #7F1D1D; }
  .comparison-table { width: 100%; font-size: 13px; border-collapse: collapse; }
  .comparison-table th { text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 8px; border-bottom: 1px solid #E5E7EB; }
  .comparison-table td { padding: 8px; border-bottom: 1px solid #F0F0F2; color: #111827; }
  .comparison-table td:not(:first-child) { text-align: right; }
  .footer { text-align: center; font-size: 11px; color: #9CA3AF; margin-top: 32px; padding-top: 16px; border-top: 1px solid #F0F0F2; }
  .category-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; text-transform: capitalize; }
  .category-badge.strength { background: rgba(184,136,14,0.14); color: #8A6408; }
  .category-badge.cardio { background: rgba(21,128,61,0.14); color: #166534; }
  .score-overall { display: flex; align-items: baseline; gap: 8px; margin-bottom: 14px; }
  .score-big { font-size: 36px; font-weight: 800; line-height: 1; }
  .score-of { font-size: 14px; color: #6B7280; font-weight: 600; }
  .score-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 3px 8px; border-radius: 6px; }
  .muscle-row { display: grid; grid-template-columns: 1fr 60px 60px; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid #F0F0F2; font-size: 13px; }
  .muscle-row:last-child { border-bottom: none; }
  .muscle-name { color: #374151; text-transform: capitalize; font-weight: 500; }
  .muscle-bar-wrap { position: relative; }
  .muscle-bar-track { position: relative; height: 8px; background: #F0F0F2; border-radius: 4px; overflow: hidden; }
  .muscle-bar-fill { position: absolute; top: 0; bottom: 0; left: 0; border-radius: 4px; }
  .muscle-bar-mev { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(107,114,128,0.6); }
  .muscle-bar-mav { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(107,114,128,0.4); }
  .muscle-sets { font-size: 12px; color: #6B7280; text-align: right; tabular-nums: true; font-variant-numeric: tabular-nums; }
  .muscle-score { font-size: 13px; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
</style>
</head>
<body>

<h1>Weekly Training Report</h1>
<p class="subtitle">${weekRange} &nbsp;·&nbsp; Solo Training Log</p>

<h2>Week at a Glance</h2>
<div class="stats-grid">
  <div class="stat"><div class="stat-value">${tw.strength + tw.cardio}</div><div class="stat-label">Sessions</div><div class="delta flat">${tw.strength} strength · ${tw.cardio} cardio</div></div>
  <div class="stat"><div class="stat-value">${tw.totalSets}</div><div class="stat-label">Working Sets</div></div>
  <div class="stat"><div class="stat-value">${tw.totalReps}</div><div class="stat-label">Total Reps</div><div class="delta ${deltaClass(repsDelta)}">${deltaSign(repsDelta)}${repsDelta.toFixed(1)}% vs last week</div></div>
</div>
<div class="stats-grid">
  <div class="stat"><div class="stat-value gold">${tw.totalVol.toLocaleString()}</div><div class="stat-label">Volume (lb)</div><div class="delta ${deltaClass(volDelta)}">${deltaSign(volDelta)}${volDelta.toFixed(1)}% vs last week</div></div>
  <div class="stat"><div class="stat-value">${prsHit.length}</div><div class="stat-label">PRs Hit</div></div>
  <div class="stat"><div class="stat-value">—</div><div class="stat-label">Session Time</div><div class="delta flat">use timer to track</div></div>
</div>

<h2>Week-over-Week</h2>
<div class="card">
  <table class="comparison-table">
    <thead><tr><th>Metric</th><th>Last Week</th><th>This Week</th><th>Delta</th></tr></thead>
    <tbody>
      <tr><td>Strength Sessions</td><td>${lw.strength}</td><td>${tw.strength}</td><td><span class="delta ${deltaClass(tw.strength - lw.strength)}">${tw.strength === lw.strength ? "—" : deltaSign(tw.strength - lw.strength) + (tw.strength - lw.strength)}</span></td></tr>
      <tr><td>Working Sets</td><td>${lw.totalSets}</td><td>${tw.totalSets}</td><td><span class="delta ${deltaClass(tw.totalSets - lw.totalSets)}">${deltaSign(tw.totalSets - lw.totalSets)}${tw.totalSets - lw.totalSets}</span></td></tr>
      <tr><td>Total Reps</td><td>${lw.totalReps}</td><td>${tw.totalReps}</td><td><span class="delta ${deltaClass(repsDelta)}">${deltaSign(repsDelta)}${repsDelta.toFixed(1)}%</span></td></tr>
      <tr><td>Volume (lb)</td><td>${lw.totalVol.toLocaleString()}</td><td>${tw.totalVol.toLocaleString()}</td><td><span class="delta ${deltaClass(volDelta)}">${deltaSign(volDelta)}${volDelta.toFixed(1)}%</span></td></tr>
    </tbody>
  </table>
</div>

${(() => {
  const v = volumeScores;
  if (!v || v.perMuscle.length === 0) return "";
  const overallColor = scoreColor(v.overall);
  const muscleRows = v.perMuscle.map((m) => {
    const pct = Math.min(100, Math.round((m.sets / Math.max(1, m.mrv)) * 100));
    const mevPct = Math.round((m.mev / Math.max(1, m.mrv)) * 100);
    const mavPct = Math.round((m.mav / Math.max(1, m.mrv)) * 100);
    let fillColor = "#9CA3AF";                             // grey: below MEV
    if (m.sets >= m.mev && m.sets <= m.mrv) fillColor = "#B8880E"; // gold: productive
    if (m.sets > m.mrv) fillColor = "#B91C1C";             // red: above MRV
    if (m.mev === 0 && m.sets === 0) fillColor = "#9CA3AF";
    const scoreColorVal = scoreColor(m.score);
    return `<div class="muscle-row">
  <div>
    <div class="muscle-name">${m.muscle}</div>
    <div class="muscle-bar-wrap" style="margin-top:4px;">
      <div class="muscle-bar-track">
        <div class="muscle-bar-fill" style="width:${pct}%; background:${fillColor};"></div>
        ${m.mev > 0 ? `<div class="muscle-bar-mev" style="left:${mevPct}%;"></div>` : ""}
        <div class="muscle-bar-mav" style="left:${mavPct}%;"></div>
      </div>
    </div>
  </div>
  <div class="muscle-sets">${m.sets} / ${m.mrv}</div>
  <div class="muscle-score" style="color:${scoreColorVal};">${m.score.toFixed(1)}</div>
</div>`;
  }).join("\n");
  return `<h2>Volume Score (MEV / MRV)</h2>
<div class="card">
  <div class="score-overall">
    <span class="score-big" style="color:${overallColor};">${v.overall.toFixed(1)}</span>
    <span class="score-of">/ 10</span>
    <span class="score-tag" style="background:${overallColor}22; color:${overallColor};">${scoreLabel(v.overall)}</span>
  </div>
  <div style="font-size:11px; color:#6B7280; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px;">
    Per muscle · sets / MRV · score
  </div>
  ${muscleRows}
  <p style="font-size:11px; color:#9CA3AF; margin-top:12px; line-height:1.5;">
    Score peaks at MAV (sweet spot), drops below MEV (under-trained) and above MRV (over-reaching). Landmarks per Renaissance Periodization (Israetel).
  </p>
</div>` ;
})()}

${prsHit.length > 0 ? `<h2>PRs Hit This Week</h2>
<div class="card"><div class="pr-list">
${prsHit.map((p) => `  <span class="pr-badge">🏆 ${p.name} — ${p.weight} ${p.unit} ×${p.reps}</span>`).join("\n")}
</div></div>` : ""}

<h2>Session Details</h2>
${sessionCards}

<h2>All-Time Top 10 PRs</h2>
<div class="card">
${top10.map((p, i) => `  <div class="top-pr-row"><span class="top-pr-rank">${i + 1}.</span><span class="top-pr-name">${p.name}</span><span class="top-pr-val">${p.weight} ${p.unit} ×${p.reps}</span></div>`).join("\n")}
</div>

<h2>Injury Watch</h2>
<div class="injury-note">
  <strong>Active:</strong> Recovering elbow and thumb joint pain. Holding program steady — no load increases on upper pressing until symptoms improve.
</div>

<h2>Coach Notes</h2>
<div class="card">
  <p style="font-size: 13px; color: #374151; line-height: 1.6;">
    <strong>Plan:</strong> Observing current program. No changes prescribed.<br><br>
    <strong>Volume trend:</strong> ${volDelta >= 0 ? "Up" : "Down"} ${Math.abs(volDelta).toFixed(1)}% week-over-week. ${volDelta > 15 ? "Consider whether this rate of increase is sustainable with current recovery." : volDelta > 0 ? "Steady progression." : "Monitor — may need adjustment if trend continues."}<br><br>
    <strong>Next assessment:</strong> Next Sunday @ 6 PM
  </p>
</div>

<div class="footer">Generated by Solo Training Log × Strength Coach &nbsp;·&nbsp; ${dateStr}</div>
</body>
</html>`;
}

async function main() {
  const now = new Date();
  const thisMon = mondayOf(now);
  const thisSun = addDays(thisMon, 6);
  const lastMon = addDays(thisMon, -7);
  const lastSun = addDays(thisMon, -1);

  const [thisWeek, lastWeek, prs, exercises] = await Promise.all([
    get(`/sessions?from=${ymd(thisMon)}&to=${ymd(thisSun)}`),
    get(`/sessions?from=${ymd(lastMon)}&to=${ymd(lastSun)}`),
    get(`/exercises/prs`),
    get(`/exercises`),
  ]);

  const thisWeekArr = Array.isArray(thisWeek) ? thisWeek : [];
  const lastWeekArr = Array.isArray(lastWeek) ? lastWeek : [];
  const prsObj = prs && typeof prs === "object" && !Array.isArray(prs) ? prs : {};
  const exArr = Array.isArray(exercises) ? exercises : [];

  const tw = weekStats(thisWeekArr);
  const lw = weekStats(lastWeekArr);
  const volDelta = lw.totalVol > 0 ? ((tw.totalVol - lw.totalVol) / lw.totalVol) * 100 : 0;
  const repsDelta = lw.totalReps > 0 ? ((tw.totalReps - lw.totalReps) / lw.totalReps) * 100 : 0;

  const prsHit = [];
  const seen = new Set();
  for (const s of thisWeekArr) {
    for (const ex of s.exercises ?? []) {
      const prData = prsObj[ex.exerciseId];
      if (!prData?.bestSet) continue;
      for (const log of ex.setLogs ?? []) {
        if (log.completed && log.weight && log.weight >= prData.bestSet.weight) {
          const key = `${ex.exercise.name}-${log.weight}-${log.reps}`;
          if (seen.has(key)) continue;
          seen.add(key);
          prsHit.push({ name: ex.exercise.name, weight: log.weight, reps: log.reps || 0, unit: log.unit || "lb" });
        }
      }
    }
  }

  const nameMap = Object.fromEntries(exArr.map((e) => [e.id, e.name]));
  const top10 = Object.entries(prsObj)
    .map(([id, info]) => ({ info, name: nameMap[id] || id.slice(0, 8) }))
    .filter(({ info }) => info.bestSet && info.bestSet.weight >= 30)
    .map(({ info, name }) => ({ name, weight: info.bestSet.weight, reps: info.bestSet.reps, unit: info.bestSet.unit || "lb" }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);

  const dateStr = ymd(now);
  const monStr = thisMon.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const sunStr = thisSun.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const weekRange = `${monStr} – ${sunStr}`;

  const volumeScores = computeVolumeScores(thisWeekArr);

  const html = buildHtml({ weekRange, dateStr, tw, lw, prsHit, top10, volDelta, repsDelta, volumeScores });
  const filename = `week-${dateStr}.html`;

  const repoPath = join(REPO_DIR, "weekly-report", filename);
  const desktopPath = join(homedir(), "Desktop", filename);
  await mkdir(join(REPO_DIR, "weekly-report"), { recursive: true });
  await writeFile(repoPath, html, "utf8");
  await writeFile(desktopPath, html, "utf8");

  console.log(`Wrote ${repoPath}`);
  console.log(`Wrote ${desktopPath}`);
  console.log(`Sessions this week: ${tw.strength + tw.cardio} · Volume: ${tw.totalVol.toLocaleString()} lb · PRs: ${prsHit.length}`);

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log("GMAIL_USER/GMAIL_APP_PASSWORD not set — skipping email.");
    return;
  }

  await sendGmail({
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
    to: REPORT_EMAIL,
    subject: `Weekly Training Report — ${weekRange}`,
    html,
  });
  console.log(`Emailed report to ${REPORT_EMAIL} (via ${GMAIL_USER})`);
}

async function sendGmail({ user, pass, to, subject, html }) {
  const boundary = `----=_stl_${Date.now().toString(36)}`;
  const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@solo-training-log>`;
  const headers = [
    `Date: ${new Date().toUTCString()}`,
    `From: Solo Training Log <${user}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Message-ID: ${messageId}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
  ].join("\r\n");
  const body = html.replace(/\r?\n/g, "\r\n");
  const raw = `${headers}\r\n\r\n${body}`;

  const tmpPath = join(tmpdir(), `stl-email-${Date.now()}-${boundary}.eml`);
  await writeFile(tmpPath, raw, "utf8");

  try {
    await new Promise((resolve, reject) => {
      const args = [
        "-sS",
        "--ssl-reqd",
        // Path component sets the EHLO/HELO hostname. Gmail rejects invalid
        // hostnames (the default would be curl's upload filename, which breaks).
        "--url",
        `smtp://${SMTP_HOST}:${SMTP_PORT}/solo-training-log.local`,
        "--mail-from",
        user,
        "--mail-rcpt",
        to,
        "--upload-file",
        tmpPath,
        "--user",
        `${user}:${pass}`,
      ];
      const proc = spawn("curl", args);
      let stderr = "";
      proc.stderr.on("data", (d) => (stderr += d.toString()));
      proc.on("error", reject);
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`curl SMTP exit ${code}: ${stderr.trim()}`));
      });
    });
  } finally {
    await rm(tmpPath, { force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
