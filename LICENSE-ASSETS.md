# 素材许可 / Asset License

**版权所有 © 2026 XMT Mecha Skin 作者。保留所有权利。**
**Copyright © 2026 XMT Mecha Skin author. All rights reserved.**

本文件只约束**美术素材**。代码部分（`src/`、`scripts/`、`lib/index.js` 中的程序逻辑）
适用 [LICENSE](LICENSE) 里的 MIT 条款，两者互不覆盖。

## 覆盖范围

| 文件 | 说明 |
|---|---|
| `assets/splash.mp4` | 开屏动画（作者生成） |
| `assets/bg.mp4` | 背景循环动画（作者生成） |
| `icon.svg` | 项目图标 |
| `lib/client.js` 中内联的上述素材 | 构建时以 base64 嵌入 |

## 允许 / Permitted

- 安装本皮肤，在 DeepSeek Harness 里**运行和使用**它，包括在商业工作环境中使用。
- 原样分发**完整**的本皮肤包（代码 + 素材，且保留本许可与版权声明）。
- 为适配新版本 DSH 而修改代码——改动的代码部分按 MIT 处理。
- 在文章、视频、评测中展示本皮肤的**截图或录屏片段**用于介绍或评论。

## 禁止 / Not permitted

- 把两段视频（含其片段、重编码版本、换皮版本）**单独提取出来**再上传、再分发，
  或用作其他项目、视频、游戏、应用、直播、模板的背景素材。
- 用这些素材**训练模型**，或作为数据集的组成部分。
- 去掉或篡改版权声明后分发。
- 以这些素材为基础制作衍生作品，并署他人之名。
- 把素材单独上传到素材站、图库、网盘合集等再分发渠道。

## 关于打包产物的说明

`lib/client.js` 是把代码与素材一起内联的构建产物（这样插件运行时不发任何网络
请求）。请这样理解它：

- 其中的**程序逻辑**按 MIT 授权；
- 其中的**美术素材**仍然受本许可约束，不因它被打包进一个 MIT 文件而变成自由素材。

换句话说：MIT 给你的是"改代码、用皮肤"的自由，不是"拿走视频随便用"的自由。

---

# Asset License (English)

This file governs **artwork only**. The program logic (`src/`, `scripts/`,
`lib/index.js`) is licensed under MIT as described in [LICENSE](LICENSE).

**Assets covered:** `assets/splash.mp4`, `assets/bg.mp4`, `icon.svg`, and the
copies of those assets embedded as base64 inside `lib/client.js`.

**Permitted:** install and run the skin in DeepSeek Harness (including at work);
redistribute the package unmodified and complete, with this license and the
copyright notice intact; modify the code to keep the skin working with newer
DSH releases (those code changes are MIT); show screenshots or short recordings
when writing about or reviewing the skin.

**Not permitted:** extract the two videos (or parts, re-encodes, or reskins of
them) and upload or redistribute them separately, or use them as background
footage in another project, video, game, application, stream, or template; use
them to train models or include them in a dataset; redistribute with the
copyright notice removed or altered; create derivative works from the footage
and credit someone else; upload the assets alone to asset sites, galleries, or
archive drives.

**Note on the build artifact:** `lib/client.js` embeds both code and artwork so
the plugin makes no network requests at runtime. The program logic inside it is
MIT; the artwork inside it stays under this license. MIT grants you the freedom
to change code and run the skin — not the freedom to take the footage and reuse
it elsewhere.
