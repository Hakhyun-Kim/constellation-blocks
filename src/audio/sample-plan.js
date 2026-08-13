/* 외부 샘플은 전투의 물성만 맡는다. UI 확인음과 마법의 음정 정보는 합성음을
 * 유지해, 파일이 없거나 디코딩이 늦어도 플레이 피드백이 사라지지 않는다. */
export const SFX_SAMPLE_CUES = Object.freeze({
  shoot: Object.freeze({ id: 'kenney-knife-slice', rate: 1.04 }),
  hit: Object.freeze({ id: 'kenney-hit-light', rate: 1.0 }),
  crit: Object.freeze({ id: 'kenney-crit-metal', rate: 0.98 }),
  block: Object.freeze({ id: 'kenney-block-heavy', rate: 0.94 }),
  kill: Object.freeze({ id: 'kenney-kill-heavy', rate: 0.92 }),
  heroHurt: Object.freeze({ id: 'kenney-hero-hurt', rate: 1.0 }),
  castleHit: Object.freeze({ id: 'kenney-castle-impact', rate: 0.82 }),
  coin: Object.freeze({ id: 'kenney-coins', rate: 1.04 }),
  place: Object.freeze({ id: 'kenney-place', rate: 0.96 }),
  waveStart: Object.freeze({ id: 'kenney-wave-latch', rate: 0.9 }),
});

export function sampleCue(name) {
  return SFX_SAMPLE_CUES[name] || null;
}
