#!/usr/bin/env node
// Wipe the alcohol-tracker user-state on the server (one-shot reset).
const API_BASE = 'https://solo-training-log.vercel.app';
const API_KEY_HEADER = 'baban2016';
const STATE_KEY = 'alcohol-tracker';

const defaultState = {
  drinks: {},
  notes: {},
  weeklyTarget: 7,
  skipUses: 0,
};

const res = await fetch(`${API_BASE}/api/user-state/${STATE_KEY}`, {
  method: 'PUT',
  headers: { 'X-API-Key': API_KEY_HEADER, 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: defaultState }),
});

if (!res.ok) {
  console.error(`❌ Wipe failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log(`✓ Wiped /api/user-state/${STATE_KEY} → defaults`);
