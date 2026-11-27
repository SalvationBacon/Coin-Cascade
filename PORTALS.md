# Portal builds

The files at the repo root are the public web build (GitHub Pages and itch). They still include cloud save, the installable app, and the mini window.

CrazyGames and Kongregate each get their own folder and zip, produced from that same `index.html` without changing how the public build behaves. `index.html` sits at the root of each zip.

```bash
node tools/build-portals.js
```

| Portal | Folder | Zip |
| --- | --- | --- |
| CrazyGames | `dist/portal/crazygames/` | `dist/portal/crazygames.zip` |
| Kongregate | `dist/portal/kongregate/` | `dist/portal/kongregate.zip` |

`dist/` is gitignored. Run the script again after changing the game. Both zips are a few megabytes (the limit that matters is 50MB to start playing, 250MB total, and 1500 files on CrazyGames; Kongregate's upload limit is 1GB).

## What the portal copies change

Both copies:

- Keep the save on the device (`localStorage`). Export and import of a save file still work.
- Do not load Firebase, Google sign-in, GoatCounter, the Google Fonts CDN, jsDelivr, or unpkg. Press Start 2P and VT323 are embedded (SIL Open Font License; see `fonts/OFL-*.txt` in the zip).
- Do not ship `manifest.json` or `sw.js`, and do not offer Install App or the mini window.
- Do not link to GitHub Pages, itch, or Ko-fi. There is no Ko-fi link in the game today.
- Do not ask for a phone to be turned upright, and do not lock the screen to portrait. A short landscape window tightens the HUD so an 800×600 desktop iframe still shows the machine. 540×960 uses the existing portrait layout.
- Gambling-flavoured words are rewritten in the portal copy only, through one phrase list (`portalSay` in `index.html`). The public build keeps the original names. Jackpot becomes Bonus, Double or Nothing becomes Coin Flip, Prize Wheel becomes Bonus Wheel, Scratch Card becomes Reveal Card, High Roller becomes Big Earner, bets and cash-outs become a set amount and Take coins, and the tagline says BUILD THE CASCADE. Save keys and upgrade ids are unchanged.

CrazyGames only:

- Loads the HTML5 SDK v3 from `https://sdk.crazygames.com/crazygames-sdk-v3.js` and calls `SDK.init()` while the game is loading.
- `loadingStart` after init, `loadingStop` when the machine is ready, `gameplayStart` when the player leaves the title screen, and `gameplayStop` if they go back to the title.
- `happytime` on a rebirth, an ascension, a rebuild, and an achievement row.
- If the SDK data module is available, the save is stored there (guests included; it falls back to the browser save when the module is switched off). A save already in `localStorage` is copied across once.
- Respects `muteAudio` from the SDK. The in-game sound and music switches cannot turn sound back on while the site has muted the game.
- Does not request ads. Basic Launch disables CrazyGames ads, and ads are not part of this build.

The Kongregate zip does not load the CrazyGames SDK.

Outside CrazyGames (a local iframe, or the Kongregate zip) the SDK is absent or `init()` fails, and the game keeps playing on the local save.

## Checking a zip in an iframe

Serve the folder (opening the file directly will not load the ES modules) and frame it at the two sizes the portals use most:

```bash
python3 -m http.server 8765
```

Then open a page that contains, for example:

```html
<iframe src="http://127.0.0.1:8765/dist/portal/crazygames/index.html" width="800" height="600"></iframe>
<iframe src="http://127.0.0.1:8765/dist/portal/crazygames/index.html" width="540" height="960"></iframe>
```

The title screen should offer Continue or Start, Import Save, Export Save, and Music. It should not offer Cloud Save, Install App, or Mini Window. In the browser network panel, the CrazyGames copy may request `sdk.crazygames.com`. It should not request Google, Firebase, fonts.googleapis.com, jsDelivr, unpkg, GoatCounter, or github.io. The Kongregate copy should not request another site at all.

## Wording

`portalSay` rewrites visible text, canvas labels, tooltips, and the all-caps toasts. It does not rename save fields or upgrade ids, so a portal save still loads in the public build and the other way around. The phrase list is in `index.html` next to `PORTAL`.

## What you still do in the portal dashboards

The three cover images are generated with `node tools/make-covers.js` (pixel art drawn in the page, no image generator) and are uploaded separately from the game zip.

### CrazyGames

Requirements checked against the developer docs (November 2026): [requirements](https://docs.crazygames.com/requirements/intro/), [technical](https://docs.crazygames.com/requirements/technical/), [gameplay](https://docs.crazygames.com/requirements/gameplay/), [account integration](https://docs.crazygames.com/requirements/account-integration/), [SDK](https://docs.crazygames.com/sdk/intro/), [game module](https://docs.crazygames.com/sdk/game/), [data module](https://docs.crazygames.com/sdk/data/), [Basic Launch](https://docs.crazygames.com/resources/basic-launch-metrics/), [covers](https://docs.crazygames.com/requirements/game-covers/).

1. Create a CrazyGames developer account and submit `dist/portal/crazygames.zip` (Basic Launch). Use their preview tool before submitting.
2. Basic Launch does not allow ads, and this build does not call them. Leave monetization off.
3. On the progress-save question, choose the SDK data module if you want the save to follow a CrazyGames account across devices. If that toggle is left off, the data module throws and the game uses `localStorage` instead. Guests can play either way.
4. Set the supported orientations to landscape and portrait. The game plays in both; CrazyGames will ask a phone to rotate when the device is in an orientation you did not enable.
5. Upload the three covers from `node tools/make-covers.js`: `cover-landscape-1920x1080.png`, `cover-portrait-800x1200.png`, and `cover-square-800x800.png`. Title text only.
6. Upload the two silent preview clips (15–20 seconds, the cabinet filling the frame). They are gameplay, so the first frame is not the cover. CrazyGames asks the hover video to open on the cover; swap the first frame for the cover image if their QA asks for that.
7. Game description and controls: mouse or touch to aim, click / tap / Space to drop, B to bank the tray. English is the only language.
8. Full Launch (only if they invite you later) also wants the data module for real, the user module, and ad breaks. Ads are intentionally not in this build. `muteAudio` is already honoured.

### Kongregate

Checked against Kongregate's developer help (2026): HTML5 upload is one `index.html` or a zip with `index.html` at the root, max 1GB. The upload agreement asks you to confirm there is no third-party ad system and no outside login or microtransaction system. Links that leave Kongregate are a common rejection.

1. Apply for a developer account at Kongregate. You cannot upload until that is approved.
2. Upload `dist/portal/kongregate.zip` as HTML5/WebGL. Do not upload the CrazyGames zip.
3. Suggested iframe minimum about 800×600, with scale-to-fit turned on so the frame can grow. Stay under the 1150×750 required minimum if the form asks for a minimum size.
4. Tick the boxes that the game has no third-party ads and no outside login. There are no microtransactions.
5. Add an English description, instructions, screenshots, and the age and AI declarations the form asks for.

## Covers and preview videos

`node tools/make-covers.js` draws the three covers in the game's pixel style (Press Start 2P plus a pegboard painted with rectangles). The only words are COIN CASCADE. They are not part of the game zip.

The preview clips are silent, 18 seconds, with the cursor hidden. They are recorded from the cabinet with the counters and side menu hidden, then scaled so the machine fills the frame. Landscape is a 16:9 crop of that view. They are not produced by `build-portals.js` and they are not committed. The pull request attaches the latest zips, covers, and clips.
