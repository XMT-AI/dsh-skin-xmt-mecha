# XMT 机甲皮肤

给 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）做的皮肤插件：开机时播放一段**开屏视频**，播完才进界面；进入后整屏铺一层**循环视频背景**；组件层按 **Apple 设计语言**（暗色）重做。

`xmt` 即「熊猫头」。皮肤里的两段视频是作者自己的机甲素材。

## 特性

- **开屏门禁** —— 全屏视频播到 `ended` 才揭开界面。视频报错、卡住或超过 30 秒兜底都会放行，不会把人锁死；3 秒后出现「点击跳过」提示。
- **循环背景** —— 固定在所有面板之后的静音循环视频，外加一层压暗纱和左侧加重的 scrim，保证文字可读。
- **Apple 风组件** —— 系统字体栈（SF Pro / Segoe UI Variable）、严格字阶、连续圆角、发丝分隔线、柔和分层阴影、Apple 蓝焦点环、`0.22s cubic-bezier(.32,.72,0,1)` 动效。
- **运行时不联网** —— 两段视频在构建时以 base64 内联进客户端包。
- **干净卸载** —— 停用插件时，样式、背景层、`body` 背景覆盖全部还原。

## 要求

- DSH `>= 0.2.0-rc.1`（写在 `dsh.engines.dsh`）
- 桌面版或 `dsh web`（纯浏览器侧 bundle）

## 安装

### 1. 应用内安装（推荐）

打开侧栏 **插件** 页，选安装，输入下面任一：

- `dsh-skin-xmt-mecha` —— 已发布到 npm 时
- `github:OWNER/dsh-skin-xmt-mecha` —— 直接从 GitHub 装，不需要 npm

装一个 bundle 默认就会启用。如果你的 profile 不是热重载的，重启应用生效。

### 2. 命令行安装

```bash
dsh plugin --profile <你的profile> add dsh-skin-xmt-mecha
```

CLI 只是 `pnpm` 的透传，**只装依赖、不会把插件加进 profile 的启用清单**。还要在 `~/.dsh/profiles/<你的profile>/package.json` 的 `dsh.profile.bundles` 里补上名字：

```json
{
  "dsh": {
    "profile": {
      "bundles": ["...", "dsh-skin-xmt-mecha"]
    }
  }
}
```

从 GitHub 装同理：

```bash
dsh plugin --profile <你的profile> add github:OWNER/dsh-skin-xmt-mecha
```

### 3. 从插件市场索引安装

DSH **没有集中的官方商店**：所谓「市场」是你自己填进去的一个 JSON 索引 URL，DSH 从它列插件并安装。如果你把 `market/index.json` 挂出去，把它的 raw 地址填进 **设置 → 插件 → 市场** 即可，例如

```
https://raw.githubusercontent.com/OWNER/dsh-skin-xmt-mecha/main/market/index.json
```

市场服务本身是个可选 bundle；如果你的版本没有 Discover 页，用上面第 1 或第 2 种方式。

## 卸载

- 应用内：**插件** 页 → 移除；或
- 命令行：`dsh plugin --profile <你的profile> remove dsh-skin-xmt-mecha`，再从 `dsh.profile.bundles` 里删掉。

## 它改了什么

按顺序注入三份样式：

| 层 | 文件 | 作用 |
|---|---|---|
| 令牌 | `src/skin.css` | Apple 系统色映射到 `--dsw-alias-*` 设计令牌 |
| 结构 | `src/patches.css` | 只做「让视频透出来」的 plumbing（见 `docs/notes.md`） |
| 组件 | `src/components.css` | 按钮、输入、菜单、弹窗、代码块、滚动条、气泡 |

结构性规则是承重墙：外壳会在负 z 层之上画不透明涂层，所以背景层被抬到 `z-index:1`，同时 `#root` 提到 `z-index:2`。

## 从源码构建

```bash
node scripts/build.mjs
```

它把 `src/*.css`、`assets/splash.mp4`、`assets/bg.mp4` 内联进 `lib/client.js`（约 5.8 MB，大头是 base64 视频）。

换自己的素材：替换 `assets/` 里那两个同名文件，重新构建。视频越短越小越好——它们是内联的。

## 开关

在侧栏打开 **插件** → 点开 **XMT Mecha Skin** 这张卡片，详情页里有一块
**皮肤设置**，三个开关加一个「恢复默认」：

| 开关 | 生效时机 |
|---|---|
| 开屏动画 | 下次启动 |
| 背景视频 | 立刻 |
| 背景压暗 | 立刻 |

选择存在 `localStorage` 的 `xmt-skin-prefs` 里。

DSH 的设计是「插件自己的配置放在插件卡片上，设置页只放只读清单」，所以这块
注册到该页面的 `plugins.detail.section` 槽位。卡片上方那个开关是整块皮肤的
总开关。

## 调参

| 想改什么 | 位置 |
|---|---|
| 开屏时长 / 跳过行为 | `src/client.template.js`（`SPLASH_*` 常量） |
| 背景压暗强度 | `src/client.template.js`（`VEIL`、`SCRIM`） |
| 配色与圆角 | `src/skin.css`（`--ds-*`、`--dsw-alias-*`） |
| 组件形状 | `src/components.css` |
| 视频裁切 | `src/client.template.js`（背景视频的 `object-position`） |

## 排查

- **背景不显示** —— 背景层靠 `xmt-lift` 关键帧抬升。若以后 DSH 改了外壳钩子（`[data-phase]`、`[data-dsh-frame]`、`[data-dsh-skin-layer]`），先复查 `src/patches.css`。
- **开屏太久** —— 右下角开关里关掉，或给应用 URL 加 `?nosplash` 直接跳过。
- **文字看不清** —— 调高 `VEIL` 的 alpha，或把 `SCRIM` 左端压得更暗。
- **整个界面起不来** —— 把包名从 profile 的 `dsh.profile.bundles` 里删掉再重启；皮肤永远不是 DSH 能启动的必要条件。

## 发布前

把 `package.json` 里的 `OWNER` 占位符换成你的 GitHub 账号（`repository`、`homepage`、`author`），然后：

```bash
npm publish --access public
node scripts/make-market-index.mjs --npm        # 市场条目指向 npm
node scripts/make-market-index.mjs --git <sha>  # 市场条目锁定到某个 commit
```

## 免责声明

非官方项目，与 DeepSeek 官方无隶属或背书关系；按"现状"提供，不附带任何担保，
使用风险由使用者自行承担；运行时不联网、不收集数据。完整条款见
[DISCLAIMER.md](DISCLAIMER.md)。

## 许可

**代码：MIT。** 见 [LICENSE](LICENSE)。可自由使用、修改、分发（含商业用途），保留
版权与许可声明即可。

**素材：保留所有权利。** 两段视频（`assets/splash.mp4`、`assets/bg.mp4`）与
`icon.svg` 是作者本人创作/生成的作品，**不在 MIT 范围内**。你可以运行本皮肤、
原样完整地转发这个包；但**不得**把视频单独提取出来再上传、再分发或挪作他用，
也不得用于训练模型。完整条款见 [LICENSE-ASSETS.md](LICENSE-ASSETS.md)。
