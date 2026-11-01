/**
 * XMT Mecha Skin — browser half.
 *
 * What this plugin does:
 *
 *   1. Shows a full-screen splash video and waits for it to END before
 *      revealing the app (a gated boot, not a flash).
 *   2. Installs a fixed backdrop layer behind the app shell that loops a
 *      video behind every panel.
 *   3. Restyles the app: design tokens, layout plumbing, and component
 *      styling (three stylesheets, inlined at build time).
 *
 * Two facts about the DSH shell drive the backdrop plumbing; both were
 * verified by measurement on the shipped desktop build:
 *
 *   · The shell paints its own opaque coats ([data-phase], [data-dsh-frame],
 *     the window .frame) above a negative-z-index layer, so a backdrop at
 *     z-index:-2 is completely hidden. The layer is therefore lifted to
 *     z-index:1 with a short forward-fill animation, and #root is raised to
 *     z-index:2 so the app shell still paints above the video.
 *   · The shell also paints `body` with a rule of its own, so the transparency
 *     that lets the video through is written as an inline style and restored
 *     on unload.
 *
 * Every switch is local to this plugin: preferences live in `localStorage` and
 * no request leaves the machine. DIAG, an opt-in loopback beacon, is off in the
 * published package.
 */

const PLUGIN_ID = 'dsh-skin-xmt-mecha'
const SKIN_ATTR = 'data-dsh-skin'
const LAYER_ATTR = 'data-dsh-skin-layer'
const STYLE_ATTR = 'data-plugin'
const DIAG = false
const DIAG_URL = 'http://127.0.0.1:8797/d'

/* Injected by scripts/build.mjs. */
const SKIN_CSS = __SKIN_CSS__
const PATCHES_CSS = __PATCHES_CSS__
const COMPONENTS_CSS = __COMPONENTS_CSS__
const SPLASH_B64 = '__SPLASH_B64__'
const BG_B64 = '__BG_B64__'

/* Readability over moving footage: a flat veil, then a left-weighted scrim.
   The artwork's subject sits on the right, so the left side stays quiet. */
const VEIL = 'rgba(4,6,10,0.34)'
const SCRIM = 'linear-gradient(90deg, rgba(4,6,10,.74) 0%, rgba(4,6,10,.46) 30%, rgba(4,6,10,.12) 62%, rgba(4,6,10,0) 100%)'

const SPLASH_GUARD_MS = 30000
const SPLASH_HINT_MS = 3000
const SPLASH_FADE_MS = 620

/* User switches, persisted per origin. `splash` takes effect on the next boot
   (the gate has already run by the time anything can be clicked); `backdrop`
   and `dim` apply immediately. */
const PREF_KEY = 'xmt-skin-prefs'
const PREF_DEFAULTS = { splash: true, backdrop: true, dim: true }

function loadPrefs() {
  try {
    const stored = JSON.parse(localStorage.getItem(PREF_KEY) || '{}')
    return { ...PREF_DEFAULTS, ...(stored && typeof stored === 'object' ? stored : {}) }
  } catch {
    return { ...PREF_DEFAULTS }
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
  } catch {
    /* a skin must work without storage (private mode, quota) */
  }
}

/* One shared preference record: the settings section and the runtime both read
   PREFS, and every write notifies the listeners so the backdrop follows at
   once instead of waiting for a reload. */
const PREFS = loadPrefs()
const prefListeners = new Set()

function setPref(key, value) {
  if (key === 'reset') Object.assign(PREFS, PREF_DEFAULTS)
  else PREFS[key] = value
  savePrefs(PREFS)
  for (const listener of prefListeners) {
    try {
      listener(key)
    } catch {
      /* one broken listener must not stop the others */
    }
  }
}

// ─────────────────────────────── utilities ───────────────────────────────

function base64ToObjectUrl(base64, mime) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: mime }))
}

function addStyle(name, css, disposers) {
  const el = document.createElement('style')
  el.setAttribute(STYLE_ATTR, PLUGIN_ID + '/' + name)
  el.textContent = css
  document.head.appendChild(el)
  disposers.push(() => el.remove())
}

/** Run once `document.body` exists (a plugin may load before parse ends). */
function onBodyReady(run, disposers) {
  if (document.body) {
    run()
    return
  }
  const observer = new MutationObserver(() => {
    if (!document.body) return
    observer.disconnect()
    run()
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
  disposers.push(() => observer.disconnect())
}

function makeVideo(src, cssText) {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.setAttribute('playsinline', '')
  video.setAttribute('muted', '')
  video.setAttribute('disablepictureinpicture', '')
  video.style.cssText = cssText
  if (src) video.src = src
  return video
}

function startVideo(video, onFail) {
  const started = video.play()
  if (started && typeof started.catch === 'function') {
    started.catch(() => { if (onFail) onFail() })
  }
}

// ─────────────────────────── 1. splash gate ───────────────────────────

function mountSplash(disposers, onFinished) {
  const host = document.createElement('div')
  host.setAttribute('data-xmt-splash', '')
  host.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:2147483000',
    'background:#05070a', 'overflow:hidden', 'opacity:1',
    'transition:opacity ' + SPLASH_FADE_MS + 'ms ease',
  ].join(';')

  const hint = document.createElement('div')
  hint.textContent = 'click to skip'
  hint.style.cssText = [
    'position:absolute', 'right:28px', 'bottom:22px',
    'font:400 12px/18px system-ui,-apple-system,"Segoe UI",sans-serif',
    'color:rgba(255,255,255,.42)', 'letter-spacing:.12em',
    'opacity:0', 'pointer-events:none', 'transition:opacity .4s ease',
  ].join(';')

  host.appendChild(hint)
  document.body.appendChild(host)

  let objectUrl = ''
  let finished = false
  let hintTimer = 0
  let guardTimer = 0

  const cleanup = () => {
    clearTimeout(hintTimer)
    clearTimeout(guardTimer)
    host.remove()
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }

  const finish = () => {
    if (finished) return
    finished = true
    clearTimeout(hintTimer)
    clearTimeout(guardTimer)
    host.style.opacity = '0'
    host.style.pointerEvents = 'none'
    window.setTimeout(() => {
      host.remove()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      onFinished()
    }, SPLASH_FADE_MS)
  }

  // The splash plays once (no loop) and only then reveals the app.
  const video = makeVideo('', 'width:100%;height:100%;object-fit:cover;display:block;')
  host.appendChild(video)
  video.addEventListener('ended', finish, { once: true })
  video.addEventListener('error', finish, { once: true })
  host.addEventListener('click', finish, { once: true })

  // Never trap the user behind a broken or stalled video.
  guardTimer = window.setTimeout(finish, SPLASH_GUARD_MS)
  hintTimer = window.setTimeout(() => { hint.style.opacity = '1' }, SPLASH_HINT_MS)

  objectUrl = base64ToObjectUrl(SPLASH_B64, 'video/mp4')
  video.src = objectUrl
  startVideo(video, finish)

  disposers.push(() => {
    finished = true
    cleanup()
  })
}

// ────────────────────────── 2. backdrop layer ──────────────────────────

function mountBackdrop(prefs) {
  const layer = document.createElement('div')
  layer.setAttribute(LAYER_ATTR, 'background')
  layer.setAttribute('aria-hidden', 'true')
  // Starts below everything; patches.css lifts it to z-index:1 after mount.
  layer.style.cssText =
    'position:fixed;top:0;right:0;bottom:0;left:0;z-index:-2;pointer-events:none;will-change:transform;'

  const objectUrl = base64ToObjectUrl(BG_B64, 'video/mp4')
  const video = makeVideo(objectUrl, 'width:100%;height:100%;object-fit:cover;object-position:right center;')
  video.loop = true
  video.autoplay = true
  layer.appendChild(video)
  startVideo(video)

  // The veil shares the layer and follows the video in DOM order: a playing
  // video is promoted to its own compositor layer, so a veil painted in a
  // lower stacking context would end up underneath it.
  const veil = document.createElement('div')
  veil.style.cssText = 'position:absolute;inset:0;pointer-events:none;background-color:' + (prefs.dim ? VEIL : 'transparent') + ';'
  layer.appendChild(veil)

  const scrim = document.createElement('div')
  scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;background-image:' + (prefs.dim ? SCRIM : 'none') + ';'
  layer.appendChild(scrim)

  document.body.appendChild(layer)

  // Inline, not a stylesheet: the shell paints `body` with a rule of its own,
  // and an inline declaration wins without fighting specificity.
  const previous = document.body.style.getPropertyValue('background-color')
  const priority = document.body.style.getPropertyPriority('background-color')
  document.body.style.setProperty('background-color', 'transparent', 'important')

  return {
    setDim(on) {
      veil.style.backgroundColor = on ? VEIL : 'transparent'
      scrim.style.backgroundImage = on ? SCRIM : 'none'
    },
    dispose() {
      layer.remove()
      video.pause()
      video.removeAttribute('src')
      URL.revokeObjectURL(objectUrl)
      if (previous) document.body.style.setProperty('background-color', previous, priority)
      else document.body.style.removeProperty('background-color')
    },
  }
}

// ───────────────────── 3. switches on the Plugins page ─────────────────────

/**
 * DSH puts a plugin's own configuration on its **Plugins page card**, not in
 * the Settings list (Settings keeps the read-only inventory). A bundle's
 * browser half reaches that surface through the `plugins.detail.section` slot,
 * so the skin registers a section there — it appears when the skin's bundle is
 * opened on the Plugins page.
 *
 * The section is built from plain elements plus inline styles: the slot renders
 * React elements, and using React directly keeps this working without depending
 * on the UI primitives package, whose exports move between DSH versions.
 */
function registerSettingsCard(ctx) {
  if (!ctx || !ctx.slots || typeof ctx.slots.inject !== 'function') return () => {}

  let react
  let jsx
  try {
    react = require('react')
    jsx = require('react/jsx-runtime')
  } catch {
    // No React in this build: no switches, but the skin still runs.
    return () => {}
  }

  const h = (type, props, ...children) => {
    const merged = { ...(props || {}) }
    if (children.length === 1) merged.children = children[0]
    else if (children.length > 1) merged.children = children
    return jsx.jsx(type, merged)
  }

  const zh = String(navigator.language || '').toLowerCase().startsWith('zh')
  const copy = zh
    ? {
        title: '皮肤设置',
        hint: '这些开关只影响本机的外观，不改动会话内容。',
        splash: '开屏动画',
        splashHint: '下次启动生效',
        backdrop: '背景视频',
        dim: '背景压暗',
        reset: '恢复默认',
      }
    : {
        title: 'Skin settings',
        hint: 'These switches change how the app looks on this machine only.',
        splash: 'Splash video',
        splashHint: 'applies on next launch',
        backdrop: 'Video backdrop',
        dim: 'Dim backdrop',
        reset: 'Reset',
      }

  const S = {
    section: {
      marginTop: 28,
      paddingTop: 18,
      borderTop: '1px solid rgba(255,255,255,.10)',
      color: '#F5F5F7',
      font: '500 13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI Variable Text","PingFang SC",sans-serif',
    },
    title: { fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 },
    hint: { fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,.5)', margin: '4px 0 12px' },
    row: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '8px 0',
    },
    label: { fontWeight: 400, color: 'rgba(255,255,255,.92)' },
    sub: { fontWeight: 400, fontSize: 11.5, color: 'rgba(255,255,255,.38)', marginLeft: 6 },
    track: (on) => ({
      position: 'relative', flex: 'none', width: 38, height: 22, padding: 0,
      borderRadius: 999, cursor: 'pointer',
      border: '1px solid ' + (on ? 'rgba(10,132,255,.9)' : 'rgba(255,255,255,.14)'),
      background: on ? '#0A84FF' : 'rgba(120,120,128,.42)',
      transition: 'background .2s ease,border-color .2s ease',
    }),
    knob: (on) => ({
      position: 'absolute', top: 2, left: 2, width: 16, height: 16, borderRadius: 999,
      background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.45)',
      transform: on ? 'translateX(16px)' : 'none',
      transition: 'transform .2s cubic-bezier(.32,.72,0,1)',
    }),
    reset: {
      marginTop: 10, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
      border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)',
      color: 'rgba(255,255,255,.72)', font: 'inherit', fontSize: 12,
    },
  }

  function Switch(props) {
    return h('button', {
      type: 'button',
      role: 'switch',
      'aria-checked': props.on ? 'true' : 'false',
      'aria-label': props.name,
      style: S.track(props.on),
      onClick: props.toggle,
    }, h('span', { style: S.knob(props.on) }))
  }

  function XmtSkinSettings(props) {
    const [snapshot, setSnapshot] = react.useState({ ...PREFS })

    react.useEffect(() => {
      const sync = () => setSnapshot({ ...PREFS })
      prefListeners.add(sync)
      return () => { prefListeners.delete(sync) }
    }, [])

    const subject = props && props.subject
    if (!subject || subject.kind !== 'bundle' || !subject.pkg || subject.pkg.name !== PLUGIN_ID) return null

    const rows = [
      ['splash', copy.splash, copy.splashHint],
      ['backdrop', copy.backdrop, null],
      ['dim', copy.dim, null],
    ]

    return h('section', { style: S.section },
      h('h3', { style: S.title }, copy.title),
      h('p', { style: S.hint }, copy.hint),
      ...rows.map(([key, text, sub]) => h('div', { key, style: S.row },
        h('span', { style: S.label }, text, sub ? h('span', { style: S.sub }, sub) : null),
        h(Switch, { on: Boolean(snapshot[key]), name: text, toggle: () => setPref(key, !PREFS[key]) }),
      )),
      h('button', { type: 'button', style: S.reset, onClick: () => setPref('reset') }, copy.reset),
    )
  }

  return ctx.slots.inject('plugins.detail.section', () => ctx.slots.register({
    name: 'plugins.detail.section',
    id: 'xmt-skin-settings',
    order: 40,
  }, XmtSkinSettings))
}

// ─────────────────────────────── diagnostics ───────────────────────────────

function report(tag, extra) {
  if (!DIAG) return
  try {
    fetch(DIAG_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tag: tag, at: new Date().toISOString(), ...extra }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* diagnostics must never break the skin */
  }
}

// ─────────────────────────────── entry point ───────────────────────────────

function apply(ctx) {
  ctx.effect(() => {
    const disposers = []

    addStyle('skin', SKIN_CSS, disposers)
    addStyle('patches', PATCHES_CSS, disposers)
    addStyle('components', COMPONENTS_CSS, disposers)

    document.documentElement.setAttribute(SKIN_ATTR, PLUGIN_ID)
    disposers.push(() => document.documentElement.removeAttribute(SKIN_ATTR))

    if (DIAG) {
      const onProblem = (event) => report('error', {
        message: String((event && (event.message || event.reason)) || event).slice(0, 300),
      })
      window.addEventListener('error', onProblem)
      window.addEventListener('unhandledrejection', onProblem)
      disposers.push(() => {
        window.removeEventListener('error', onProblem)
        window.removeEventListener('unhandledrejection', onProblem)
      })
      report('apply', { hasBody: Boolean(document.body), vw: innerWidth, vh: innerHeight })
    }

    // The settings section lives on the Plugins page; registration survives
    // regardless of when the page mounts (slots.inject waits for the slot).
    try {
      const disposeCard = registerSettingsCard(ctx)
      if (typeof disposeCard === 'function') disposers.push(disposeCard)
    } catch {
      /* a missing slot must not take the skin down */
    }

    onBodyReady(() => {
      let backdrop = null

      const syncBackdrop = () => {
        if (PREFS.backdrop && !backdrop) backdrop = mountBackdrop(PREFS)
        if (!PREFS.backdrop && backdrop) {
          backdrop.dispose()
          backdrop = null
        }
      }

      const onPrefChange = (key) => {
        syncBackdrop()
        if (backdrop && key === 'dim') backdrop.setDim(PREFS.dim)
      }

      const start = () => syncBackdrop()

      // Escape hatch for debugging: open the app URL with ?nosplash.
      const skipSplash = new URLSearchParams(location.search).has('nosplash')
      if (!PREFS.splash || skipSplash) start()
      else mountSplash(disposers, start)

      prefListeners.add(onPrefChange)
      disposers.push(() => {
        prefListeners.delete(onPrefChange)
        if (backdrop) backdrop.dispose()
      })
    }, disposers)

    return () => {
      for (const dispose of disposers.reverse()) dispose()
    }
  }, PLUGIN_ID)
}
