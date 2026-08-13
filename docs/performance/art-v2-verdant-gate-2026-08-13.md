# 푸른 초원 `art-v2` 성능 기록 — 2026-08-13

## 범위와 방법

Quaternius 캐릭터·몬스터 파일럿에 Medieval Village MegaKit 성문, 직선 성벽,
원형 문, 망루 모듈을 추가한 뒤 기본 procedural 장면과 비교했다. 원본 모델과
라이선스·변환 내역은 `assets/manifest.json`과 `CREDITS.md`에 기록했다.

- 로컬 Chromium, Windows, DPR 1에서 `scripts/serve.mjs`의 no-store 응답을 사용했다.
- 데스크톱은 1440×900, `gfx=high&decor=on`; 모바일은 실제 390×844,
  `gfx=lite&mobile=1&decor=off`로 측정했다.
- `judge=1&perf=1&mute&hour=11`이 같은 시드의 첫 전투를 120 고정 틱 진행한 뒤
  엔진 상태를 멈춘다. 네 경우 모두 `verdant-dawn`, 웨이브 1, 살아 있는 적 3,
  대기 적 8인 동일 장면이었다.
- 에셋 preload 완료 500ms 뒤부터 10초간 프레임 간격을 수집했다. 평균 FPS와
  p95 프레임 시간은 `src/app/perf-probe.js`의 결정적 계산을 사용했다.
- `firstPlay`는 첫 WebGL 프레임, `assetsReady`는 선택한 모드의 preload 완료까지다.
  로컬 수치이므로 원격 네트워크 지연을 나타내지는 않는다.

## 결과

| 지표 | 데스크톱 procedural | 데스크톱 `art-v2` | 변화 | 모바일 procedural | 모바일 `art-v2` | 변화 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 첫 프레임 | 226.56ms | 257.09ms | +13.48% | 203.03ms | 237.72ms | +17.09% |
| preload 완료 | 337.60ms | 708.10ms | +109.75% | 324.70ms | 639.00ms | +96.80% |
| 전체 전송량 | 1,387,546B | 4,141,607B | +2,754,061B | 1,387,546B | 4,141,607B | +2,754,061B |
| 에셋 전송량 | 0B | 2,754,061B | +2,754,061B | 0B | 2,754,061B | +2,754,061B |
| 평균 FPS | 56.96 | 56.96 | 0.00% | 56.90 | 57.00 | +0.18% |
| 평균 프레임 | 17.56ms | 17.56ms | 0.00% | 17.58ms | 17.54ms | -0.23% |
| p95 프레임 | 18.10ms | 18.10ms | 0.00% | 18.10ms | 18.10ms | 0.00% |
| 드로우콜 | 273 | 286 | +13 | 243 | 254 | +11 |
| 삼각형 | 99,199 | 118,551 | +19,352 | 11,165 | 30,085 | +18,920 |
| 텍스처 | 7 | 29 | +22 | 6 | 28 | +22 |
| geometry | 271 | 292 | +21 | 241 | 260 | +19 |

## 판단

- 평균 FPS 하락 10%, p95 악화 20%의 병합 중단 기준을 모두 통과했다. 측정 오차
  범위에서 데스크톱 FPS는 같고 모바일은 0.18% 높았으며 p95는 모두 같았다.
- 첫 프레임 증가는 데스크톱 30.53ms, 모바일 34.69ms다. 기본 URL은 manifest와
  외부 모델을 요청하지 않으므로 이 증가는 `?art=v2` 파일럿에만 해당한다.
- 외부 파일 2.63MiB를 포함한 브라우저 전체 전송은 약 3.95MiB다. 정적 예산
  검사는 선로딩 12MiB와 전체 런타임 60MiB 기준 안에 있다.
- 모바일 드로우콜은 파일럿 추가분이 11이지만 장면 전체가 권장 목표 60을 이미
  크게 넘는다. 전체 아트 이식 전에는 절차형 환경과 반복 오브젝트의 병합·인스턴싱을
  별도 최적화 단위로 다룬다.
- 실제 390×844 화면에서 성문 실루엣, 적 3종, 방어로와 전술판을 확인했고 콘솔
  오류는 없었다.

## P0 최종 증거와 판정

- [브라우저 비교 페이지](../evidence/art-v2/index.html)
- [procedural 데스크톱 10초](../evidence/art-v2/verdant-desktop-high-procedural.webm) /
  [`art-v2` 데스크톱 10초](../evidence/art-v2/verdant-desktop-high-art-v2.webm)
- [procedural 데스크톱 JPEG](../evidence/art-v2/verdant-desktop-high-procedural.jpg) /
  [`art-v2` 데스크톱 JPEG](../evidence/art-v2/verdant-desktop-high-art-v2.jpg)
- [procedural 모바일 JPEG](../evidence/art-v2/verdant-mobile-lite-procedural.jpg) /
  [`art-v2` 모바일 JPEG](../evidence/art-v2/verdant-mobile-lite-art-v2.jpg)

판정은 **GO**다. 외부 모델은 성문, 사람형 영웅, 작은 일반 적, 큰 중간보스를
절차형보다 빠르게 구분하게 하고, 같은 제작자 계열이라 장면의 비례와 색이 크게
갈라지지 않는다. 데스크톱·모바일 평균 FPS와 p95는 병합 기준을 통과했고, 실제
효과음까지 포함한 초기 정적 예산은 3.91MiB다. 전체 화면 점멸도 다시 생기지 않았다.

다만 이 결과가 곧바로 기본 모드 전환을 뜻하지는 않는다. `?art=v2` 격리를 유지한
채 같은 에셋 계열을 다른 영웅·지역으로 확장하고, P1 정보 계층 정리와 모바일
드로우콜 최적화를 거친 뒤 기본값 전환 여부를 다시 판단한다.
