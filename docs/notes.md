# 数据哨兵 · 设计与实测记录

## 0. 三层架构

| 文件 | 职责 | 说明 |
|---|---|---|
| `src/skin.css` | L1 令牌层 | Apple 官方系统色（暗色模式），全部 8 位 hex |
| `src/patches.css` | L2 结构层 | 只管「视频能透出来」，一行视觉都没有 |
| `src/components.css` | L3 组件层 | 按钮/输入/菜单/弹窗/代码块的 Apple 设计语言 |

组件层是「看起来像半成品」的解药：只换面板颜色，组件还是应用默认样式，
新旧混搭就不完整。三层缺一不可。

**所有选择器前缀 `html[data-dsh-skin]`**：DSH 插件直接注入 `<style>`，
不像市场皮肤会自动加作用域前缀，必须自己加，否则样式会漏到别处。
前缀还顺带提高特异性（0,1,3），压得住应用 CSS Modules 的哈希类名。

## 1. 设计语言：Apple 简约 + 一点科技感

用户明确要求「苹果那种简约风格然后再带点科技的感觉」，
并且否掉了「照搬现成皮肤」的做法——那类皮肤是赛博终端语言
（满屏等宽字 + 大写 + 0.22em 字距 + 霓虹辉光），是两套东西。

所以这一版是**重新设计**，不是换色搬运：

| 维度 | 做法 |
|---|---|
| 字体 | 系统 UI 字体（-apple-system / SF Pro）；等宽只留给代码与数值 |
| 字号 | 严格字阶 11/12/13/14.5/17+，字距随字号收紧（-0.01em 起） |
| 形状 | 控件 6-8px、卡片 12-16px、发送键与芯片 999px |
| 材质 | 半透明填充 + 顶部 1px 内高光 + 柔和分层阴影，**不用霓虹辉光** |
| 焦点 | Apple 蓝色光环 `0 0 0 3px rgba(10,132,255,.28)` |
| 动效 | 0.22s / `cubic-bezier(.32,.72,0,1)`，按下缩到 0.97 |
| 科技感 | systemCyan `#64D2FF` 少量点缀（代码块边框、行内代码、dock 选中线） |

配色用 Apple 官方系统色：systemBlue `#0A84FF`、systemCyan `#64D2FF`、
systemGreen `#30D158`、systemRed `#FF453A`、systemOrange `#FF9F0A`，
文字四级 `#FFFFFF / 60% / 30% / 18%`。

## 2. 配色也从视频里量过（第一版的依据，保留参考）

用 `_diag/palette.mjs`（ffmpeg 抽帧 → 缩放 → 统计）从用户自己的两段视频里量出来：

| 来源 | 主色 | 辉光 | 暗部占比 |
|---|---|---|---|
| 背景循环动画 | 冷钢蓝灰 `#1b232a` → `#3b4654` | `#627690`（低饱和蓝灰） | 49% |
| 启动动画 | 深蓝 `#092847` / `#183858` | `#b2e4ff`（淡冰蓝） | 62% |

结论：**视频本身没有霓虹青**。鲸鱼那套 `#39FFD1` 青 + `#3A7BFF` 电光蓝
是它自己角色的配色，和用户 footage 不匹配。

## 3. 为什么背景层要「抬升」

背景视频层初始在 `z-index:-2`（负 z 才能待在所有面板之下）。
但应用外壳会在中间层画不透明底，负 z 的视频会被盖死。

解法（`src/patches.css` A2）：

```css
@keyframes xmt-lift { from { z-index: -2 } to { z-index: 1 } }
html[data-dsh-skin] body [data-dsh-skin-layer='background'] {
  animation: xmt-lift 1ms linear 700ms forwards;
}
```

**坑：`@keyframes` 必须写在顶层。** 写成 `html[data-dsh-skin] @keyframes xmt-lift`
会被判为无效并静默忽略——层永远卡在 -2，视频全黑，而且不报任何错。
实测踩过：探针里 `animationName` 显示 `xmt-lift` 但 `keyframes` 列表里没有它。

同时把应用外壳 `#root` 提到 `z-index:2`，于是层级是
`画布(-1) → 视频(1) → 外壳(2)`，外壳内部的面板半透明 → 视频透出来。

## 4. 必须保留的结构性规则（`src/patches.css` 的 A 段）

| 编号 | 规则 | 不做会怎样 |
|---|---|---|
| A1 | `body > #root { position: relative; z-index: 2 }` | 外壳与视频互相盖住 |
| A2 | `xmt-lift` 动画 | 视频永远停在 -2，被中间层盖死 |
| A3 | `[data-phase] / [data-dsh-frame]` 透明 | 外壳自带暗色涂层压住视频 |
| A4 | 对话区去模糊去压暗图 | 背景视频在对话区看不见 |
| A5 | 头部涂层改挂真 header | 整列对话区发灰 |
| A6 | 输入卡 `backdrop-filter: none !important` | 皮肤中心注入的模糊把视频糊掉 |
| A7 | Windows 桌面端 `.frame` 去底 | 桌面版整体比网页版暗一截 |
| A8 | hero 首屏去背景图 | 首屏被主题背景盖住 |

> A1 只能针对 `#root`。写 `body > div:not(...)` 会误伤菜单与弹层（它们也是
> body 的直接子 div），实测会让工作区菜单被裁到 y=1338。

## 5. 令牌层的特异性问题

主题的令牌定义在 `body` 上（`body{...}` 和 `body[data-ds-dark-theme]{...}`）。
同特异性时**后注入者胜**，而主题样式是在插件之后注入的——所以本皮肤写：

```css
html[data-dsh-skin],
html[data-dsh-skin] body { --dsw-alias-*: ... !important; }
```

`html[data-dsh-skin] body` 是 (0,1,2)，压得住 `body[data-ds-dark-theme]` 的 (0,1,1)；
再加 `!important` 兜底。颜色一律 8 位 hex——皮肤白名单不接受 `rgba()`。

## 6. 组件定位的坑

- **发送键**：靠「没有 `aria-haspopup`」定位（模型/思考模式弹层都有它）。
  但权限芯片是官方插槽 `data-slot="conversation.input.permission"`，
  必须单独排除，否则它会变成蓝色圆球。
- **代码块**：挂在 `pre > [data-code-block-content] > [data-code-wrap]` 下，
  **不在 `[data-dsh-part='message-body']` 里**，只写后者不生效。
- **右侧 dock**：`surface` 是外壳（不能给底色+描边+圆角，否则变成一张
  贴右边的「浮窗」），`content` 才是有底色和边线的那层。

## 7. 视频素材处理

| 文件 | 处理 |
|---|---|
| `启动动画.mp4`（46MB / 16.7s / 2560×1440 / 60fps） | ffmpeg → 1280 宽 / 24fps / CRF 29 / faststart → 2.57MB |
| `无声音背景循环动画.mp4`（35MB / 15.1s / 2558×1440） | ffmpeg → 1280 宽 / 24fps / CRF 28 / faststart → 1.71MB |

## 8. 已知环境差异

本机还有一个隔离探针 profile（`~/.dsh/profiles/probe1`）用于无副作用验证。
它用的是 CLI 装的前端（0.2.0-rc.2），比桌面版（0.2.1-rc.5）旧：
- 旧前端有硬编码纯白的 `.pI_x6G_frame`，且没有 `data-phase` /
  `data-dsh-frame` 这类新版钩子，所以探针里看不到完整外观；
- 探针能验证的是结构性事实：层抬到 z=1、视频在播、body 透明、令牌生效、
  `@keyframes` 真的注册了、视频确实参与绘制（开/关图层有 651 个采样点亮度差）。

桌面版真机的数据由诊断通道直接回传（2560×1392，类名 `V4vHZW_*` / `an3WzG_*`）。

## 9. 诊断通道

插件启动后会向 `http://127.0.0.1:8797/d` 发一条状态上报（`apply` /
`body-ready` / `splash-done` / `bg-state`），包含层的 z-index、动画名、
视频播放状态、令牌实际值、以及「谁在挡」的祖先链与右侧栏几何。
接收端：`node _diag/beacon.mjs`，日志 `_diag/beacon.log`。
接收端不在时，插件会把同样的内容以黑底小面板显示在右下角（30 秒后自动消失）。
