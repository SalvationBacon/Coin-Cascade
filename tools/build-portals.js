#!/usr/bin/env node
// Builds the CrazyGames and Kongregate copies of Coin Cascade.
// The files at the repo root are the public web build and are not modified.
//
//   node tools/build-portals.js
//
// Writes dist/portal/crazygames/ and dist/portal/kongregate/ (index.html at the
// folder root, libraries under lib/ and fonts/) and matching .zip files.
// Also writes dist/portal/crazygames-flat/ with every file at the root, because
// the CrazyGames uploader rejects folders inside a zip.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist", "portal");
const fontsDir = path.join(__dirname, "portal-fonts");

const FONT_CSS = `<style>
@font-face { font-family: "Press Start 2P"; font-style: normal; font-weight: 400; font-display: swap; src: url("fonts/press-start-2p-latin.woff2") format("woff2"); }
@font-face { font-family: "VT323"; font-style: normal; font-weight: 400; font-display: swap; src: url("fonts/vt323-latin.woff2") format("woff2"); }
</style>
`;

// Phrases that point players at another site. Both branches of the source
// ternaries are rewritten so the zip does not contain them.
const PHRASES = [
  ["The game engine couldn't be downloaded. An ad blocker or network filter may be blocking cdn.jsdelivr.net and unpkg.com. Try allowing them, or a different network.",
    "The game engine couldn't be loaded from this copy of the game."],
  ["Cloud Save (sign in with Google, completely optional) keeps your game online and syncs it between your phone and computer. It's the best protection if your browser data ever gets cleared.",
    "Progress stays on this device. There is no account sign-in in this version."],
  [" Downloads only work in the app or on the GitHub page.", ""],
  ["Save files can only be downloaded in the app or on the GitHub page.", "Couldn't download the save file."],
  ["Cloud save works in the installed app and on the GitHub page, not here.", "Cloud save is turned off in this version."],
  ["Sign in with Google to keep this game in sync across your phone and computer.", "Cloud save is turned off in this version."],
  ["SIGN IN WITH GOOGLE", "SIGN IN"],
];

function stripTag(html, re) {
  const next = html.replace(re, "");
  if (next === html) throw new Error("expected tag not found: " + re);
  return next;
}

function portalHtml(html, portal) {
  let out = html.replace(/\/\*PORTAL_EXTERNAL\*\/[\s\S]*?\/\*END_PORTAL_EXTERNAL\*\//g, "/* removed in the portal build */");
  if (out.includes("PORTAL_EXTERNAL")) throw new Error("unbalanced PORTAL_EXTERNAL marker");
  out = stripTag(out, /<link rel="canonical"[^>]*>\n?/);
  out = stripTag(out, /<meta property="og:url"[^>]*>\n?/);
  out = stripTag(out, /<meta property="og:image"[^>]*>\n?/);
  out = stripTag(out, /<meta property="og:image:width"[^>]*>\n?/);
  out = stripTag(out, /<meta property="og:image:height"[^>]*>\n?/);
  out = stripTag(out, /<meta property="og:image:alt"[^>]*>\n?/);
  out = stripTag(out, /<meta name="twitter:image"[^>]*>\n?/);
  out = stripTag(out, /<meta name="twitter:image:alt"[^>]*>\n?/);
  out = stripTag(out, /<link rel="manifest"[^>]*>\n?/);
  out = stripTag(out, /<link rel="apple-touch-icon"[^>]*>\n?/);
  out = stripTag(out, /<script data-goatcounter[\s\S]*?<\/script>\n?/);
  out = stripTag(out, /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/);
  out = stripTag(out, /<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^"]*">\n?/);
  out = stripTag(out, /<meta name="apple-mobile-web-app-capable"[^>]*>\n?/);
  out = stripTag(out, /<meta name="mobile-web-app-capable"[^>]*>\n?/);
  out = stripTag(out, /<meta name="apple-mobile-web-app-status-bar-style"[^>]*>\n?/);
  out = stripTag(out, /<meta name="apple-mobile-web-app-title"[^>]*>\n?/);
  if (!out.includes("<style>")) throw new Error("style tag missing after font removal");
  out = out.replace("<style>", FONT_CSS + "<style>");
  const boot = `<script>window.CC_PORTAL=${JSON.stringify(portal)};document.documentElement.dataset.portal=window.CC_PORTAL;</script>\n`
    + (portal === "crazygames" ? `<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n` : "");
  out = out.replace("<head>", "<head>\n" + boot);
  for (const [from, to] of PHRASES) {
    if (!out.includes(from)) throw new Error("expected phrase missing from source: " + from.slice(0, 60));
    out = out.split(from).join(to);
  }
  assertClean(out, portal);
  return out;
}

function assertClean(html, portal) {
  const urls = html.match(/https?:\/\/[^"'\\\s)]+|\/\/[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
  const allowed = new Set(["http://www.w3.org/2000/svg"]);
  if (portal === "crazygames") allowed.add("https://sdk.crazygames.com/crazygames-sdk-v3.js");
  const bad = urls.filter(u => !allowed.has(u));
  if (bad.length) throw new Error(portal + " still has external URLs:\n" + bad.join("\n"));
  const banned = [
    "github.io", "github.com", "goatcounter", "zgo.at", "jsdelivr", "unpkg.com",
    "firebaseapp.com", "firebasestorage", "googleapis", "gstatic", "itch.io",
    "ko-fi", "kofi.com", "AIza", "manifest.json", "serviceWorker.register",
  ];
  if (portal !== "crazygames") banned.push("crazygames.com");
  const found = banned.filter(s => html.includes(s));
  if (found.length) throw new Error(portal + " still mentions: " + found.join(", "));
}

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function buildOne(portal) {
  const dir = path.join(dist, portal);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "lib"), { recursive: true });
  fs.mkdirSync(path.join(dir, "fonts"), { recursive: true });
  const html = portalHtml(fs.readFileSync(path.join(root, "index.html"), "utf8"), portal);
  fs.writeFileSync(path.join(dir, "index.html"), html);
  copyFile(path.join(root, "favicon.png"), path.join(dir, "favicon.png"));
  copyFile(path.join(root, "lib", "three.module.js"), path.join(dir, "lib", "three.module.js"));
  copyFile(path.join(root, "lib", "rapier.es.js"), path.join(dir, "lib", "rapier.es.js"));
  for (const name of ["press-start-2p-latin.woff2", "vt323-latin.woff2", "OFL-PressStart2P.txt", "OFL-VT323.txt"]) {
    copyFile(path.join(fontsDir, name), path.join(dir, "fonts", name));
  }
  const zip = path.join(dist, portal + ".zip");
  fs.rmSync(zip, { force: true });
  execFileSync("zip", ["-r", "-X", "-q", zip, "."], { cwd: dir });
  const files = execFileSync("zip", ["-sf", zip], { encoding: "utf8" });
  if (!/^index\.html$/m.test(files.split("\n").map(l => l.trim()).join("\n")) && !files.includes("index.html")) {
    throw new Error(portal + " zip is missing index.html");
  }
  const listing = execFileSync("unzip", ["-l", zip], { encoding: "utf8" });
  const entries = listing.split("\n").filter(l => /\s(index\.html|lib\/|fonts\/|favicon\.png)/.test(l));
  if (!entries.some(l => /\bindex\.html$/.test(l.trim()) || l.trim().endsWith("index.html"))) {
    throw new Error(portal + " zip listing has no index.html at the root:\n" + listing);
  }
  const totalLine = listing.trim().split("\n").pop();
  const bytes = Number(totalLine.trim().split(/\s+/)[0]);
  const count = Number(totalLine.trim().split(/\s+/)[1]);
  if (!(bytes > 0) || bytes > 50 * 1024 * 1024) throw new Error(portal + " zip is " + bytes + " bytes (limit 50MB for the initial download)");
  if (!(count > 0) || count > 1500) throw new Error(portal + " has " + count + " files (limit 1500)");
  return { zip, dir, bytes, count, listing };
}

// CrazyGames rejects a zip that contains folders. The flat copy puts the
// libraries and fonts next to index.html and points the loader at those names.
function flattenHtml(html) {
  const replacements = [
    ['new URL("lib/" + f, location.href)', "new URL(f, location.href)"],
    ['loadScript("lib/" + f)', "loadScript(f)"],
    ['url("fonts/press-start-2p-latin.woff2")', 'url("press-start-2p-latin.woff2")'],
    ['url("fonts/vt323-latin.woff2")', 'url("vt323-latin.woff2")'],
  ];
  let out = html;
  for (const [from, to] of replacements) {
    if (!out.includes(from)) throw new Error("flat rewrite could not find: " + from);
    out = out.split(from).join(to);
  }
  const left = out.match(/.{0,30}(?:lib\/|fonts\/).{0,30}/g);
  if (left) throw new Error("flat html still has a nested path:\n" + left.join("\n"));
  return out;
}

function buildFlat(portal) {
  const nested = path.join(dist, portal);
  const dir = path.join(dist, portal + "-flat");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), flattenHtml(fs.readFileSync(path.join(nested, "index.html"), "utf8")));
  const names = ["favicon.png", "three.module.js", "rapier.es.js", "press-start-2p-latin.woff2", "vt323-latin.woff2", "OFL-PressStart2P.txt", "OFL-VT323.txt"];
  const from = {
    "favicon.png": path.join(nested, "favicon.png"),
    "three.module.js": path.join(nested, "lib", "three.module.js"),
    "rapier.es.js": path.join(nested, "lib", "rapier.es.js"),
  };
  for (const name of ["press-start-2p-latin.woff2", "vt323-latin.woff2", "OFL-PressStart2P.txt", "OFL-VT323.txt"]) {
    from[name] = path.join(nested, "fonts", name);
  }
  for (const name of names) copyFile(from[name], path.join(dir, name));
  const zip = path.join(dist, portal + "-flat.zip");
  fs.rmSync(zip, { force: true });
  execFileSync("zip", ["-X", "-q", zip, ...names, "index.html"], { cwd: dir });
  const listing = execFileSync("unzip", ["-l", zip], { encoding: "utf8" });
  const nestedEntry = listing.split("\n").find(l => /\.(html|js|woff2|png|txt)$/.test(l) && l.includes("/"));
  if (nestedEntry) throw new Error(portal + " flat zip still has a folder:\n" + nestedEntry);
  if (!listing.includes("index.html") || !listing.includes("three.module.js") || !listing.includes("press-start-2p-latin.woff2")) {
    throw new Error(portal + " flat zip is missing a root file:\n" + listing);
  }
  console.log(portal + "-flat: " + path.relative(root, dir));
  console.log("  zip " + path.relative(root, zip));
}

function main() {
  for (const portal of ["crazygames", "kongregate"]) {
    const info = buildOne(portal);
    const mb = (info.bytes / 1024 / 1024).toFixed(2);
    console.log(portal + ": " + info.count + " files, " + mb + " MB uncompressed");
    console.log("  folder " + path.relative(root, info.dir));
    console.log("  zip    " + path.relative(root, info.zip));
  }
  buildFlat("crazygames");
}

main();
