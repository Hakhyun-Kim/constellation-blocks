import fs from 'node:fs';
import {
  evaluateEarlyAccessScope,
  formatPlaytestReport,
  summarizePlaytestSessions,
} from '../src/app/playtest-analysis.js';

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const participantArg = args.find((arg) => arg.startsWith('--participants='));
const files = args.filter((arg) => !arg.startsWith('--'));

if (!files.length) {
  console.error('Usage: npm.cmd run playtest:report -- <export.json> [more.json] [--participants=N] [--json]');
  process.exitCode = 1;
} else {
  const sessions = [];
  for (const file of files) {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(parsed.sessions)) throw new Error(`${file}: sessions array is required`);
    sessions.push(...parsed.sessions);
  }
  const explicitParticipants = participantArg ? Number(participantArg.split('=')[1]) : files.length;
  if (!Number.isInteger(explicitParticipants) || explicitParticipants < 1) throw new Error('--participants must be a positive integer');
  const summary = summarizePlaytestSessions(sessions, { participantCount: explicitParticipants });
  const decision = evaluateEarlyAccessScope(summary);
  if (jsonOutput) console.log(JSON.stringify({ summary, decision }, null, 2));
  else console.log(formatPlaytestReport(summary, decision));
}
