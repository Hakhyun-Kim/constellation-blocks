import assert from 'node:assert/strict';
import { captureFilename, supportedVideoMime } from '../src/app/visual-capture.js';

assert.equal(captureFilename(), 'verdant-desktop-high-procedural.webm');
assert.equal(captureFilename({ artMode: 'v2', quality: 'lite', mobile: true }), 'verdant-mobile-lite-v2.webm');
assert.equal(supportedVideoMime(null), '');
assert.equal(supportedVideoMime({ isTypeSupported: (mime) => mime.includes('vp8') }), 'video/webm;codecs=vp8');
assert.equal(supportedVideoMime({ isTypeSupported: () => false }), 'video/webm');

console.log('✅ 동일 장면 캡처 파일명·WebM 폴백 검사 통과');
