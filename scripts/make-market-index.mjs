// 生成插件市场索引（format 1）。
//
//   node scripts/make-market-index.mjs --npm              从 npm 安装
//   node scripts/make-market-index.mjs --npm https://registry.npmjs.org
//   node scripts/make-market-index.mjs --git <40位commit>  从 GitHub 安装（锁定 commit）
//
// 索引本身要和插件包一起挂在 https 上；DSH 在「设置 → 插件 → 市场」里读它。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const argv = process.argv.slice(2)
const mode = argv[0]

if (mode !== '--npm' && mode !== '--git') {
  console.error('usage: make-market-index.mjs --npm [registry] | --git <commit> [repoUrl]')
  process.exit(1)
}

let source
if (mode === '--npm') {
  const registry = argv[1]
  source = registry ? { type: 'npm', registry } : { type: 'npm' }
} else {
  const commit = argv[1]
  if (!/^[0-9a-f]{40}$/u.test(commit || '')) {
    console.error('--git needs a lowercase 40-hex commit SHA (git rev-parse HEAD)')
    process.exit(1)
  }
  const repoUrl = argv[2] || (pkg.repository && pkg.repository.url ? pkg.repository.url.replace(/\.git$/u, '') : null)
  if (!repoUrl) {
    console.error('no repository URL in package.json and none given')
    process.exit(1)
  }
  source = { type: 'git', url: repoUrl, commit }
}

const publishTimestamp = Math.floor(Date.now() / 1000)

const index = {
  format: 1,
  title: {
    en: 'XMT Mecha Skin — market',
    zh: 'XMT 机甲皮肤 — 市场',
  },
  description: {
    en: 'A small index of DeepSeek Harness skins and themes.',
    zh: '一个 DSH 皮肤 / 主题的小索引。',
  },
  metadata: {
    categories: {
      skin: { title: { en: 'Skins & themes', zh: '皮肤与主题' } },
    },
    labels: {
      animated: { title: { en: 'Animated', zh: '动态' } },
      'dark-mode': { title: { en: 'Dark mode', zh: '暗色' } },
    },
    sortKeys: {
      stars: { title: { en: 'Stars', zh: '星标' }, order: 'desc' },
    },
  },
  plugins: [
    {
      name: pkg.name,
      title: {
        en: 'XMT Mecha Skin',
        zh: 'XMT 机甲皮肤（熊猫头机甲）',
      },
      description: {
        en: 'Gated splash video on boot, then a looping video backdrop, with an Apple-style dark component layer.',
        zh: '开屏视频播完才进界面，之后整屏循环视频背景，组件层按 Apple 设计语言重做。',
      },
      icon: '../icon.svg',
      author: pkg.author === 'OWNER' ? undefined : pkg.author,
      homepage: pkg.homepage && !pkg.homepage.includes('OWNER') ? pkg.homepage : undefined,
      metadata: {
        category: 'skin',
        keywords: ['skin', 'theme', 'splash', 'video background', 'mecha', 'apple', 'dark'],
        labels: ['animated', 'dark-mode'],
        sortKeys: { stars: 0 },
      },
      versions: [
        {
          version: pkg.version,
          publishTimestamp,
          source,
          engines: { dsh: pkg.dsh.engines.dsh },
        },
      ],
    },
  ],
}

// 去掉值为 undefined 的成员（索引格式不接受 null/undefined 之外的杂项）
const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue
      out[k] = clean(v)
    }
    return out
  }
  return value
}

mkdirSync(join(root, 'market'), { recursive: true })
const dest = join(root, 'market', 'index.json')
writeFileSync(dest, JSON.stringify(clean(index), null, 2) + '\n')

console.log(`wrote ${dest}`)
console.log(`  plugin   ${pkg.name}@${pkg.version}`)
console.log(`  source   ${source.type}${source.registry ? ' (' + source.registry + ')' : ''}${source.commit ? ' @ ' + source.commit.slice(0, 7) : ''}`)
console.log('\nHost this file over https and add its URL under Settings → Plugins → Market.')
