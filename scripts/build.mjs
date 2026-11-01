import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const assets = join(root, 'assets')
const template = readFileSync(join(root, 'src', 'client.template.js'), 'utf8')

const splash = readFileSync(join(assets, 'splash.mp4')).toString('base64')
const bg = readFileSync(join(assets, 'bg.mp4')).toString('base64')

// Stylesheets are inlined as JSON strings so quotes and newlines inside them
// cannot break the emitted script.
const skinCss = JSON.stringify(readFileSync(join(root, 'src', 'skin.css'), 'utf8'))
const patchesCss = JSON.stringify(readFileSync(join(root, 'src', 'patches.css'), 'utf8'))
const componentsCss = JSON.stringify(readFileSync(join(root, 'src', 'components.css'), 'utf8'))

// split/join rather than String#replace: base64 can contain `$` sequences that
// replace would treat as substitution patterns.
const body = template
  .split('__SKIN_CSS__').join(skinCss)
  .split('__PATCHES_CSS__').join(patchesCss)
  .split('__COMPONENTS_CSS__').join(componentsCss)
  .split('__SPLASH_B64__').join(splash)
  .split('__BG_B64__').join(bg)

// DSH client plugins are not ES modules: they load as classic <script> tags and
// register through the page's `__ModuleLoader__`. A top-level `export` throws
// "Unexpected token 'export'" and takes the whole boot down, so the wrapper
// below provides `exports` and assigns the entry points itself. The `id` must
// equal the package name.
const out = `window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${body}
    exports.apply = apply;
    exports.inject = ["slots"];
    return module.exports;
  },
});
`

writeFileSync(join(root, 'lib', 'client.js'), out)

const mb = (n) => (n / 1048576).toFixed(2)
console.log(`splash.mp4    ${mb(statSync(join(assets, 'splash.mp4')).size)} MB`)
console.log(`bg.mp4        ${mb(statSync(join(assets, 'bg.mp4')).size)} MB`)
console.log(`lib/client.js ${mb(Buffer.byteLength(out))} MB`)
