# XMT Mecha Skin

A skin plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH): a **gated splash video** on boot, then a **looping video backdrop** behind the whole app, with an **Apple-style component layer** in dark mode.

`xmt` stands for 熊猫头 (panda head); the skin's artwork is the author's own mecha footage.

## Features

- **Splash gate** — a full-screen video plays to its end (`ended`) before the app is revealed. Errors, a stalled video, or a 30 s guard fall through instead of trapping you; a "click to skip" hint appears after 3 s.
- **Looping backdrop** — a fixed, muted, looping video sits behind every panel, with a veil and a left-weighted scrim so text stays readable.
- **Apple-style components** — system font stack (SF Pro / Segoe UI Variable), strict type scale, continuous radii, hairline separators, soft layered shadows, Apple blue focus rings, `0.22s cubic-bezier(.32,.72,0,1)` motion.
- **No network at runtime** — both videos are inlined into the client bundle at build time.
- **Clean unload** — styles, the backdrop layer, and the `body` background override are all restored when the plugin is disabled.

## Requirements

- DSH `>= 0.2.0-rc.1` (declared as `dsh.engines.dsh`)
- Desktop app or `dsh web` (the skin is a browser-side bundle)

## Install

### 1. From the app (recommended)

Open the **Plugins** page in the app sidebar, choose install, and enter one of:

- `dsh-skin-xmt-mecha` — from npm, once published
- `github:XMT-AI/dsh-skin-xmt-mecha` — straight from GitHub, no npm needed

Installing a bundle enables it by default. Restart the app if your profile is not live-reloading.

### 2. From the CLI

```bash
dsh plugin --profile <your-profile> add dsh-skin-xmt-mecha
```

The CLI is a thin `pnpm` passthrough, so it adds the dependency but does **not** add the bundle to the profile roster. Add the name to `dsh.profile.bundles` in `~/.dsh/profiles/<your-profile>/package.json`:

```json
{
  "dsh": {
    "profile": {
      "bundles": ["...", "dsh-skin-xmt-mecha"]
    }
  }
}
```

GitHub install works the same way:

```bash
dsh plugin --profile <your-profile> add github:XMT-AI/dsh-skin-xmt-mecha
```

### 3. From a plugin market index

DSH ships no central store: a "market" is any JSON index URL you add under **Settings → Plugins → Market**, and DSH lists and installs from it. If you host `market/index.json` (see below), add its raw URL — for example

```
https://raw.githubusercontent.com/XMT-AI/dsh-skin-xmt-mecha/main/market/index.json
```

The market service is an optional bundle; if your build has no Discover tab, install as in option 1 or 2 instead.

## Uninstall

- In the app: **Plugins** page → remove, or
- CLI: `dsh plugin --profile <your-profile> remove dsh-skin-xmt-mecha`, then drop it from `dsh.profile.bundles`.

## What it changes

Three stylesheets are injected, in this order:

| Layer | File | Role |
|---|---|---|
| Tokens | `src/skin.css` | Apple system colors mapped onto the `--dsw-alias-*` design tokens |
| Structure | `src/patches.css` | Only the plumbing that lets the video through (see `docs/notes.md`) |
| Components | `src/components.css` | Buttons, inputs, menus, dialogs, code blocks, scrollbars, chat bubbles |

The structural rules are the load-bearing part: the shell paints opaque coats above a negative-z-index layer, so the backdrop is lifted to `z-index:1` while `#root` is raised to `z-index:2`.

## Build from source

```bash
npm install          # nothing to install, but harmless
node scripts/build.mjs
```

That inlines `src/*.css`, `assets/splash.mp4`, and `assets/bg.mp4` into `lib/client.js` (~5.8 MB, mostly base64 video).

To use your own footage, replace the two files in `assets/` (same names) and rebuild. Keep them short and small — each is inlined.

## Switches

Open **Plugins** in the sidebar, then the **XMT Mecha Skin** bundle. Its detail
page carries a **Skin settings** section with three switches plus **Reset**:

| Switch | Takes effect |
|---|---|
| Splash video | on the next launch |
| Video backdrop | immediately |
| Dim backdrop | immediately |

Choices are stored in `localStorage` under `xmt-skin-prefs`.

DSH puts a plugin's own configuration on its Plugins card rather than in
Settings (Settings keeps a read-only inventory), so the section is registered
into that page's `plugins.detail.section` slot. The bundle's own on/off switch
above it turns the whole skin off.

## Tuning

| What | Where |
|---|---|
| Splash length / skip behaviour | `src/client.template.js` (`SPLASH_*` constants) |
| Backdrop dimming | `src/client.template.js` (`VEIL`, `SCRIM`) |
| Colors and radii | `src/skin.css` (`--ds-*`, `--dsw-alias-*`) |
| Component shapes | `src/components.css` |
| Video fit / crop | `src/client.template.js` (`object-position` on the backdrop video) |

## Troubleshooting

- **Backdrop invisible** — the layer is raised by the `xmt-lift` keyframes. If a future DSH build renames the shell hooks (`[data-phase]`, `[data-dsh-frame]`, `[data-dsh-skin-layer]`), re-check `src/patches.css`.
- **Splash feels long** — turn it off in the control panel, or open the app URL with `?nosplash`.
- **Text hard to read** — raise `VEIL` alpha, or darken the left end of `SCRIM`.
- **Nothing loads at all** — remove the bundle from the profile's `dsh.profile.bundles` and restart; a skin is never required for DSH to boot.

## Publishing notes

The `repository`, `homepage`, and `author` fields in `package.json` already point at this repo. To publish:

```bash
npm publish --access public
node scripts/make-market-index.mjs --npm        # market entry pointing at npm
node scripts/make-market-index.mjs --git <sha>  # market entry pinned to a commit
```

## Disclaimer

Unofficial project, not affiliated with or endorsed by DeepSeek. Provided "as
is", without warranty; use at your own risk. No telemetry and no network
requests at runtime. See [DISCLAIMER.md](DISCLAIMER.md) for the full text.

## License

- **Code — MIT.** See [LICENSE](LICENSE). Use, modify, and redistribute freely,
  including commercially, keeping the notices.
- **Artwork — all rights reserved.** The two videos (`assets/splash.mp4`,
  `assets/bg.mp4`) and `icon.svg` are the author's own work and are **not** MIT.
  Run the skin and pass the package along intact, but do not extract the footage
  to reuse, re-upload, or redistribute elsewhere, and do not train models on it.
  Full terms: [LICENSE-ASSETS.md](LICENSE-ASSETS.md).
