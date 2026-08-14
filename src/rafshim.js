/* ?rafshim: 숨겨진 탭/자동화 환경에서 rAF가 스로틀될 때 타이머로 구동 (테스트용) */
(() => {
  const query = new URLSearchParams(location.search);
  if (!query.has('rafshim') && document.visibilityState !== 'hidden') return;
  window.requestAnimationFrame = (callback) => setTimeout(() => callback(performance.now()), 33);
  window.cancelAnimationFrame = clearTimeout;
})();
