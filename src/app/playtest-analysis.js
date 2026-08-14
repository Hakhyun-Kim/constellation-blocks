export const PLAYTEST_REPORT_VERSION = 1;
export const PLAYTEST_EXPERIENCE_PROFILES = Object.freeze(['novice', 'regular', 'expert']);

const MODES = Object.freeze(['campaign', 'weekly']);
const COMPLETE_OUTCOMES = Object.freeze({
  campaign: 'campaign-complete',
  weekly: 'weekly-complete',
});
const TARGET_MINUTES = Object.freeze({
  campaign: Object.freeze([25, 40]),
  weekly: Object.freeze([10, 15]),
});
const EXIT_OUTCOMES = new Set(['abandon', 'load', 'new-game', 'restart', 'spectate']);

export function normalizePlaytestExperience(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (['novice', 'beginner'].includes(normalized)) return 'novice';
  if (['regular', 'intermediate'].includes(normalized)) return 'regular';
  if (['expert', 'advanced'].includes(normalized)) return 'expert';
  return 'unspecified';
}

const finiteMs = (value) => Number.isFinite(Number(value)) && Number(value) >= 0
  ? Math.round(Number(value)) : 0;
const rate = (value, total) => total > 0 ? Math.round((value / total) * 10000) / 10000 : null;
const minutes = (value) => value == null ? null : Math.round((value / 60000) * 100) / 100;

function quantile(values, position) {
  if (!values.length) return null;
  const sorted = values.map(finiteMs).sort((a, b) => a - b);
  const index = (sorted.length - 1) * position;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return Math.round(sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower));
}

function hasCheckpoint(session, names) {
  const checkpoints = session?.checkpoints;
  return !!checkpoints && typeof checkpoints === 'object' && names.some((name) => checkpoints[name]);
}

function validSession(session) {
  return !!session && typeof session === 'object'
    && session.schemaVersion === 1
    && MODES.includes(session.mode)
    && typeof session.outcome === 'string'
    && session.outcome !== 'in-progress'
    && Number.isFinite(Number(session.activeMs))
    && Number(session.activeMs) >= 0;
}

function summarizeMode(records, mode) {
  const attempts = records.filter((session) => session.mode === mode);
  const completionOutcome = COMPLETE_OUTCOMES[mode];
  const completed = attempts.filter((session) => session.outcome === completionOutcome);
  const defeated = attempts.filter((session) => session.outcome === 'defeat');
  const exited = attempts.filter((session) => EXIT_OUTCOMES.has(session.outcome));
  const retries = attempts.filter((session) => session.startKind === 'retry' || Number.isInteger(session.retryOf));
  const completedActive = completed.map((session) => finiteMs(session.activeMs));
  const attemptActive = attempts.map((session) => finiteMs(session.activeMs));
  const [targetMin, targetMax] = TARGET_MINUTES[mode];
  const targetCompleted = completedActive.filter((value) => value >= targetMin * 60000 && value <= targetMax * 60000);
  const totalActiveMs = attemptActive.reduce((sum, value) => sum + value, 0);
  const totalActions = attempts.reduce((sum, session) => sum + Object.values(session.actions || {})
    .reduce((actionSum, value) => actionSum + Math.max(0, Number(value) || 0), 0), 0);

  const outcomeCounts = {};
  for (const session of attempts) outcomeCounts[session.outcome] = (outcomeCounts[session.outcome] || 0) + 1;

  return {
    mode,
    targetMinutes: [targetMin, targetMax],
    attempts: attempts.length,
    completed: completed.length,
    defeated: defeated.length,
    exited: exited.length,
    retries: retries.length,
    completionRate: rate(completed.length, attempts.length),
    defeatRate: rate(defeated.length, attempts.length),
    exitRate: rate(exited.length, attempts.length),
    retryRate: rate(retries.length, attempts.length),
    completedWithinTargetRate: rate(targetCompleted.length, completed.length),
    completedActiveMinutes: {
      p25: minutes(quantile(completedActive, 0.25)),
      median: minutes(quantile(completedActive, 0.5)),
      p75: minutes(quantile(completedActive, 0.75)),
    },
    attemptActiveMinutes: {
      p25: minutes(quantile(attemptActive, 0.25)),
      median: minutes(quantile(attemptActive, 0.5)),
      p75: minutes(quantile(attemptActive, 0.75)),
    },
    checkpointRate: {
      firstDefense: rate(attempts.filter((session) => hasCheckpoint(session, ['first-defense', 'first-defense-start'])).length, attempts.length),
      act1Complete: rate(attempts.filter((session) => hasCheckpoint(session, ['dawn-road-complete'])).length, attempts.length),
      act2Start: rate(attempts.filter((session) => hasCheckpoint(session, ['act2-start'])).length, attempts.length),
    },
    actionsPerActiveMinute: totalActiveMs > 0
      ? Math.round((totalActions / (totalActiveMs / 60000)) * 100) / 100 : null,
    outcomeCounts,
  };
}

export function summarizePlaytestSessions(sessions = [], { participantCount = null } = {}) {
  const input = Array.isArray(sessions) ? sessions : [];
  const valid = input.filter(validSession);
  const participants = Number.isInteger(participantCount) && participantCount >= 0 ? participantCount : null;
  const linkedRetries = valid.filter((session) => Number.isInteger(session.retryOf)
    && valid.some((candidate) => candidate.sequence === session.retryOf));
  const experienceSessionCounts = Object.fromEntries(
    [...PLAYTEST_EXPERIENCE_PROFILES, 'unspecified'].map((profile) => [
      profile,
      valid.filter((session) => normalizePlaytestExperience(session.experience) === profile).length,
    ]),
  );
  const byExperience = Object.fromEntries(PLAYTEST_EXPERIENCE_PROFILES.map((profile) => {
    const records = valid.filter((session) => normalizePlaytestExperience(session.experience) === profile);
    return [profile, {
      sessions: records.length,
      campaign: summarizeMode(records, 'campaign'),
      weekly: summarizeMode(records, 'weekly'),
    }];
  }));
  const normalNoviceCampaign = valid.filter((session) => session.mode === 'campaign'
    && session.difficulty === 'normal'
    && normalizePlaytestExperience(session.experience) === 'novice');
  return {
    reportVersion: PLAYTEST_REPORT_VERSION,
    evidence: {
      participantCount: participants,
      participantCountVerified: participants != null,
      validSessions: valid.length,
      excludedSessions: input.length - valid.length,
      linkedRetries: linkedRetries.length,
      unlinkedRetries: valid.filter((session) => Number.isInteger(session.retryOf)).length - linkedRetries.length,
      experienceSessionCounts,
      missingExperienceProfiles: PLAYTEST_EXPERIENCE_PROFILES.filter((profile) => experienceSessionCounts[profile] === 0),
    },
    campaign: summarizeMode(valid, 'campaign'),
    weekly: summarizeMode(valid, 'weekly'),
    byExperience,
    normalNoviceCampaign: {
      attempts: normalNoviceCampaign.length,
      firstDefenseRate: rate(normalNoviceCampaign.filter((session) => hasCheckpoint(session, ['first-defense', 'first-defense-start'])).length, normalNoviceCampaign.length),
      act1CompleteRate: rate(normalNoviceCampaign.filter((session) => hasCheckpoint(session, ['dawn-road-complete'])).length, normalNoviceCampaign.length),
    },
    overallRetryRate: rate(valid.filter((session) => session.startKind === 'retry' || Number.isInteger(session.retryOf)).length, valid.length),
  };
}

export function evaluateEarlyAccessScope(summary, {
  minimumParticipants = 5,
  minimumAttemptsPerMode = 5,
  minimumCompletedPerMode = 3,
} = {}) {
  const campaign = summary?.campaign || {};
  const weekly = summary?.weekly || {};
  const participants = summary?.evidence?.participantCount;
  const missing = [];
  if (!Number.isInteger(participants)) missing.push('verified-participant-count');
  else if (participants < minimumParticipants) missing.push(`participants-${participants}/${minimumParticipants}`);
  if ((campaign.attempts || 0) < minimumAttemptsPerMode) missing.push(`campaign-attempts-${campaign.attempts || 0}/${minimumAttemptsPerMode}`);
  if ((weekly.attempts || 0) < minimumAttemptsPerMode) missing.push(`weekly-attempts-${weekly.attempts || 0}/${minimumAttemptsPerMode}`);
  if ((campaign.completed || 0) < minimumCompletedPerMode) missing.push(`campaign-completions-${campaign.completed || 0}/${minimumCompletedPerMode}`);
  if ((weekly.completed || 0) < minimumCompletedPerMode) missing.push(`weekly-completions-${weekly.completed || 0}/${minimumCompletedPerMode}`);
  for (const profile of summary?.evidence?.missingExperienceProfiles || PLAYTEST_EXPERIENCE_PROFILES) {
    missing.push(`experience-profile-${profile}`);
  }

  if (missing.length) {
    return {
      status: 'insufficient-evidence',
      recommendation: 'hold-two-chapter-demo',
      missing,
      scope: 'Keep the current two-chapter campaign and weekly challenge. Do not add Act 3, PvP, monetization, or a large inventory system yet.',
    };
  }

  const campaignMedian = campaign.completedActiveMinutes?.median;
  const weeklyMedian = weekly.completedActiveMinutes?.median;
  if ((campaign.completionRate ?? 0) < 0.6 || campaignMedian > 40 || weeklyMedian > 15) {
    return {
      status: 'action-required',
      recommendation: 'shorten-and-ease-current-scope',
      missing: [],
      scope: 'Freeze new regions. Improve onboarding, pacing, and failure recovery inside the current two chapters.',
    };
  }

  if (campaignMedian < 25) {
    if ((summary.overallRetryRate ?? 0) >= 0.35 && (weekly.completionRate ?? 0) >= 0.6) {
      return {
        status: 'evidence-supported',
        recommendation: 'add-one-region-without-a-new-core-system',
        missing: [],
        scope: 'Add one authored region or encounter family, reusing match-3, hero-active, and town systems. Re-measure before Act 3.',
      };
    }
    return {
      status: 'action-required',
      recommendation: 'improve-replay-value-before-expansion',
      missing: [],
      scope: 'The campaign is short but replay intent is weak. Improve route, build, and weekly variation before adding more map length.',
    };
  }

  if ((summary.overallRetryRate ?? 0) < 0.25) {
    return {
      status: 'action-required',
      recommendation: 'prove-replay-value-before-early-access',
      missing: [],
      scope: 'The length is acceptable, but retry intent is weak. Polish build variety and weekly reasons to return before expanding content.',
    };
  }

  return {
    status: 'evidence-supported',
    recommendation: 'retain-two-chapter-early-access-base',
    missing: [],
    scope: 'Use the current two chapters and weekly challenge as the Early Access base. Add content only in measured, one-region increments.',
  };
}

const percent = (value) => value == null ? 'n/a' : `${Math.round(value * 1000) / 10}%`;
const minuteValue = (value) => value == null ? 'n/a' : `${value.toFixed(2)} min`;

export function formatPlaytestReport(summary, decision = evaluateEarlyAccessScope(summary)) {
  const lines = [
    '# Constellation Defense playtest report',
    '',
    `- Participants: ${summary.evidence.participantCount ?? 'unverified'}`,
    `- Valid sessions: ${summary.evidence.validSessions} (excluded ${summary.evidence.excludedSessions})`,
    `- Experience sessions: novice ${summary.evidence.experienceSessionCounts.novice}, regular ${summary.evidence.experienceSessionCounts.regular}, expert ${summary.evidence.experienceSessionCounts.expert}, unspecified ${summary.evidence.experienceSessionCounts.unspecified}`,
    `- Decision: ${decision.recommendation}`,
    `- Status: ${decision.status}`,
    '',
  ];
  for (const mode of MODES) {
    const data = summary[mode];
    lines.push(`## ${mode}`, '');
    lines.push(`- Attempts / completions: ${data.attempts} / ${data.completed}`);
    lines.push(`- Completion / exit / retry: ${percent(data.completionRate)} / ${percent(data.exitRate)} / ${percent(data.retryRate)}`);
    lines.push(`- Completed active p25 / median / p75: ${minuteValue(data.completedActiveMinutes.p25)} / ${minuteValue(data.completedActiveMinutes.median)} / ${minuteValue(data.completedActiveMinutes.p75)}`);
    lines.push(`- First defense / Act 1 / Act 2 conversion: ${percent(data.checkpointRate.firstDefense)} / ${percent(data.checkpointRate.act1Complete)} / ${percent(data.checkpointRate.act2Start)}`, '');
  }
  lines.push('## Experience cohorts', '');
  for (const profile of PLAYTEST_EXPERIENCE_PROFILES) {
    const data = summary.byExperience[profile];
    lines.push(`- ${profile}: ${data.sessions} sessions · campaign completion ${percent(data.campaign.completionRate)} · weekly completion ${percent(data.weekly.completionRate)}`);
  }
  lines.push(`- Normal/novice Act 1 completion: ${percent(summary.normalNoviceCampaign.act1CompleteRate)} (${summary.normalNoviceCampaign.attempts} attempts)`, '');
  lines.push('## Scope', '', decision.scope);
  if (decision.missing.length) lines.push('', `Missing evidence: ${decision.missing.join(', ')}`);
  return `${lines.join('\n')}\n`;
}
