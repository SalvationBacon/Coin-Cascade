# Coin Cascade

A pixel-art peg board that feeds a coin pusher, built as a long incremental game: upgrade trees, rebirths, ascensions, challenges, gambles and cosmetics.

**Play:** https://salvationbacon.github.io/Coin-Cascade/

## Install it

- **Chrome / Edge (PC, Android):** press **INSTALL APP** on the title screen, or use the install icon in the address bar.
- **iPhone / iPad:** open the page in Safari, tap **Share**, then **Add to Home Screen**.

Installed, it opens in its own window and plays offline.

## Mini window (PC)

Press **MINI WINDOW** on the title screen to play in a small phone-shaped window you can park in a corner while you work.
In Chrome and Edge it stays on top of your other windows; other browsers open a normal popup.
The big window pauses until you close the mini one or press **BRING IT BACK HERE**.

## Moving your progress

Menu → Settings → **Send to another device** (or SEND TO DEVICE on the title screen) shows a QR code and a link with your progress inside. Scan it or open the link on your other phone or computer, and the game there asks before loading it. Nothing is stored online.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The whole game |
| `lib/` | Three.js 0.160.0, Rapier 3D (compat) 0.12.0 and qrcode-generator 1.4.4 (MIT), so the game works offline |
| `manifest.json`, `sw.js` | Installable app and offline cache |
| `icon-*.png`, `apple-touch-icon.png`, `favicon.png` | Icons, made by `node tools/make-icons.js` |

## Deploying updates

1. Edit `index.html` and bump `VERSION`.
2. Bump `CACHE` in `sw.js` to match, so installed copies pick up the new version.
3. Commit and push to `main`. GitHub Pages serves the repo root.
