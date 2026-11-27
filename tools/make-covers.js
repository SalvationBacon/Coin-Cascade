#!/usr/bin/env node
// Pixel covers for CrazyGames. Drawn in the browser with the game's font and
// rectangle art. No image generator. Writes PNGs next to this script's output
// directory (dist/portal/covers) and prints their paths.
//
//   node tools/make-covers.js

const fs = require("fs");
const path = require("path");
function loadPuppeteer() {
  for (const name of ["puppeteer-core", "/tmp/cc-test/node_modules/puppeteer-core"]) {
    try { return require(name); } catch {}
  }
  throw new Error("Install puppeteer-core to draw the covers (npm install puppeteer-core).");
}
const puppeteer = loadPuppeteer();

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist", "portal", "covers");
const font = fs.readFileSync(path.join(__dirname, "portal-fonts", "press-start-2p-latin.woff2")).toString("base64");

const html = `<!doctype html>
<meta charset="utf-8">
<style>
@font-face { font-family: "Press Start 2P"; src: url(data:font/woff2;base64,${font}) format("woff2"); }
</style>
<canvas id="c"></canvas>
<script>
const BG = "#120c22";
function sprite() {
  const w = 64, h = 84, g = document.createElement("canvas").getContext("2d");
  g.canvas.width = w; g.canvas.height = h;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const P = (x, y, c) => R(x, y, 1, 1, c);
  R(0, 0, 64, 84, "#f5b83d");
  R(2, 2, 60, 8, "#1d2b44");
  for (let i = 0; i < 9; i++) P(5 + i * 6, 4, i % 2 ? "#fff6c8" : "#6a3a10");
  R(3, 11, 58, 46, "#1a7a7a");
  for (let y = 13; y < 55; y += 4) for (let x = 6; x < 58; x += 4) if ((x + y) % 8 === 0) P(x, y, "#146464");
  const rows = [[18, 46], [14, 36, 50], [10, 24, 40, 54], [8, 20, 32, 44, 56], [12, 26, 40, 54], [16, 32, 48]];
  rows.forEach((xs, i) => xs.forEach(x => { P(x, 18 + i * 5, "#ffd24a"); P(x, 19 + i * 5, "#a07a14"); }));
  // coin waiting at the top
  for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) {
    const r = x * x + y * y;
    if (r <= 25) P(32 + x, 16 + y, r > 16 ? "#9c560e" : "#ffd34d");
    if (r <= 9 && x + y < 0) P(32 + x, 16 + y, "#fff2a0");
  }
  const slots = ["#e04a4a", "#3d7ad4", "#1a1e28", "#3d7ad4", "#f5b83d", "#3d7ad4", "#1a1e28", "#3d7ad4", "#e04a4a"];
  slots.forEach((c, i) => R(4 + i * 6, 50, 6, 7, c));
  R(3, 58, 58, 10, "#1a6b3a");
  for (let i = 0; i < 14; i++) {
    const x = 6 + (i % 7) * 8, y = 60 + Math.floor(i / 7) * 4;
    P(x, y, "#ffe9a0"); P(x + 1, y, "#ffd34d"); P(x, y + 1, "#c99a1f"); P(x + 1, y + 1, "#a07a14");
  }
  R(2, 70, 60, 12, "#141820");
  R(2, 69, 60, 2, "#f5b83d");
  for (let i = 0; i < 16; i++) {
    const x = 5 + (i % 8) * 7, y = 73 + Math.floor(i / 8) * 4;
    P(x, y, "#fff2c0"); P(x + 1, y, "#ffd34d"); P(x + 2, y, "#c99a1f");
    P(x, y + 1, "#e0b040"); P(x + 1, y + 1, "#a07a14"); P(x + 2, y + 1, "#8a5a10");
  }
  return g.canvas;
}
function title(g, x, y, size, align) {
  g.font = size + 'px "Press Start 2P"';
  g.textAlign = align || "left";
  g.textBaseline = "top";
  g.fillStyle = "#05030b";
  g.fillText("COIN", x + 8, y + 8);
  g.fillText("CASCADE", x + 8, y + size + 16 + 8);
  g.fillStyle = "#ffd24a";
  g.fillText("COIN", x, y);
  g.fillStyle = "#f4efff";
  g.fillText("CASCADE", x, y + size + 16);
}
function paint(w, h, place) {
  const c = document.getElementById("c");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.fillStyle = BG;
  g.fillRect(0, 0, w, h);
  const art = sprite();
  place(g, art);
  return c.toDataURL("image/png").split(",")[1];
}
document.fonts.load('64px "Press Start 2P"').then(() => {
  const files = {};
  files["cover-landscape-1920x1080.png"] = paint(1920, 1080, (g, art) => {
    g.drawImage(art, 90, 36, 64 * 12, 84 * 12);
    title(g, 980, 400, 72, "left");
  });
  files["cover-portrait-800x1200.png"] = paint(800, 1200, (g, art) => {
    title(g, 400, 64, 40, "center");
    g.drawImage(art, 80, 250, 64 * 10, 84 * 10);
  });
  files["cover-square-800x800.png"] = paint(800, 800, (g, art) => {
    title(g, 400, 36, 34, "center");
    g.drawImage(art, 176, 190, 64 * 7, 84 * 7);
  });
  window.__covers = files;
});
</script>`;

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.waitForFunction(() => window.__covers);
  const files = await page.evaluate(() => window.__covers);
  for (const [name, b64] of Object.entries(files)) {
    const dest = path.join(outDir, name);
    fs.writeFileSync(dest, Buffer.from(b64, "base64"));
    console.log(dest, fs.statSync(dest).size);
  }
  await browser.close();
})();
