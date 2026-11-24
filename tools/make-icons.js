// Draws the app icon as 32×32 pixel art (a stack of coins with a big ×5 coin on top) and writes the PNGs.
// Usage: node tools/make-icons.js   (needs Playwright + Chromium)
//   icon-192.png, icon-512.png   full-bleed ("any")
//   icon-maskable-512.png        art at ~80% so Android's round masks never cut it
//   apple-touch-icon.png (180)   iOS rounds the corners itself
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BG = '#11161f';

function art(P, R, C) {
  R(0, 0, 32, 32, '#11161f');
  // soft panel behind
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (Math.hypot(x - 15.5, y - 15.5) < 14) P(x, y, '#1a2230');
  // little coin stack at the bottom
  for (let i = 0; i < 3; i++) { const y = 26 - i * 2; R(9, y, 14, 2, '#c99a1f'); R(9, y, 14, 1, '#ffd34d'); R(8, y, 1, 2, '#a07a14'); R(23, y, 1, 2, '#a07a14'); }
  // big coin
  C(15.5, 13.5, 9, '#a07a14');
  C(15.5, 12.5, 9, '#ffd34d');
  C(15.5, 12.5, 7, '#f0b92a');
  C(15.5, 12.5, 6, '#ffd34d');
  // "5" in dark ink
  const ink = '#11161f';
  R(13, 8, 6, 2, ink); R(13, 10, 2, 2, ink); R(13, 12, 5, 2, ink); R(17, 13, 2, 3, ink); R(13, 16, 5, 2, ink);
  // shine
  P(10, 8, '#fff6c8'); P(11, 7, '#fff6c8'); P(10, 9, '#fff0a0');
}

(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const out = await p.evaluate(({ src, BG }) => {
    const art = eval('(' + src + ')');
    const base = document.createElement('canvas'); base.width = base.height = 32;
    const g = base.getContext('2d');
    const P = (x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }, R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const C = (cx, cy, r, c) => { for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) { const px = Math.floor(cx + x), py = Math.floor(cy + y); if (Math.hypot(px + 0.5 - cx, py + 0.5 - cy) <= r) P(px, py, c); } };
    art(P, R, C);
    const make = (size, scale) => { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
      x.fillStyle = BG; x.fillRect(0, 0, size, size); x.imageSmoothingEnabled = false;
      const d = 32 * scale, o = Math.round((size - d) / 2); x.drawImage(base, o, o, d, d); return c.toDataURL('image/png').split(',')[1]; };
    return { 'icon-192.png': make(192, 6), 'icon-512.png': make(512, 16), 'icon-maskable-512.png': make(512, 13), 'apple-touch-icon.png': make(180, 5), 'favicon.png': make(32, 1) };
  }, { src: art.toString(), BG });
  const root = path.join(__dirname, '..');
  for (const [f, b64] of Object.entries(out)) { fs.writeFileSync(path.join(root, f), Buffer.from(b64, 'base64')); console.log('wrote', f); }
  await b.close();
})();
