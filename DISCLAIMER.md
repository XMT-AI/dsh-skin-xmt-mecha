# 免责声明 / Disclaimer

## 中文

**非官方项目。** 本皮肤（XMT Mecha Skin）是个人开源项目，与 DeepSeek 官方及
DeepSeek Harness 的开发团队没有任何隶属、赞助或背书关系。"DeepSeek"、
"DeepSeek Harness" 等名称与商标归其各自权利人所有，本项目仅在描述兼容性时使用。

**按"现状"提供。** 本软件不附带任何明示或默示担保，包括但不限于适销性、特定用途
适用性与不侵权担保。因使用或无法使用本软件造成的任何直接或间接损失（包括但不限于
界面异常、数据丢失、工作中断），作者与贡献者不承担责任。

**第三方界面。** 本皮肤通过覆盖样式与插入 DOM 的方式改变 DSH 的外观，属于对被修改
软件的非常规用法。DSH 升级后钩子可能变化，导致外观异常甚至界面不可用；请在升级前
知悉这一风险，出问题时用下方"回滚"一节恢复。

**素材版权（重要）。** `assets/splash.mp4`、`assets/bg.mp4` 与 `icon.svg` 由项目作者
本人创作/生成，**版权归作者所有，保留一切权利**。它们**不在 MIT 许可范围内**：
你可以安装、运行本皮肤，也可以原样分发完整包，但**不得**把这两段视频（或其片段、
重编码、换皮版本）单独提取后再上传、再分发，或用作其他项目、视频、游戏、应用、
直播、模板的背景素材，也不得用于训练模型。完整条款见
[LICENSE-ASSETS.md](LICENSE-ASSETS.md)。

需要说明的是：打包产物 `lib/client.js` 把代码与素材内联在一起（这样插件运行时
不发网络请求），所以"素材不可自由使用"是由许可声明约束的，不是由技术手段加密的。
如果你想彻底杜绝被取用，唯一可靠的办法是不随包分发视频——那就得改成让使用者
自备素材，代价是装上不能直接看到效果。

**无遥测、不联网。** 插件运行时不发起任何网络请求，不收集、不上传任何数据；唯一的
本地存储是 `localStorage` 里的 `xmt-skin-prefs`，用于记住你自己的开关选择，可以
随时清除。

**许可。** 本项目以 MIT 许可开源，详见 [LICENSE](LICENSE)。你可以自由使用、修改、
分发，包括商业使用，但需保留版权声明与许可声明。

**回滚。** 在应用的插件页停用或移除本插件；或用命令行
`dsh plugin --profile <你的profile> remove dsh-skin-xmt-mecha`，并从 profile 的
`dsh.profile.bundles` 中删掉本包名。

## English

**Unofficial.** XMT Mecha Skin is a personal open-source project. It is not
affiliated with, sponsored by, or endorsed by DeepSeek or the DeepSeek Harness
team. "DeepSeek" and "DeepSeek Harness" are the property of their respective
owners and are used here only to describe compatibility.

**Provided "as is",** without warranty of any kind, express or implied,
including but not limited to the warranties of merchantability, fitness for a
particular purpose, and non-infringement. In no event shall the authors or
contributors be liable for any claim, damages, or other liability arising from,
out of, or in connection with the software or its use.

**Third-party UI.** This skin changes the appearance of DSH by overriding
styles and inserting DOM nodes — an unsupported use of the host application.
A DSH upgrade may rename the hooks it relies on, which can break the look or the
interface. Roll back as described below if that happens.

**Artwork.** The two videos under `assets/` were created by this project's
author and are released under the same license. If you redistribute the skin
with your own footage, the rights and the responsibility for that footage are
yours.

**No telemetry, no network.** The plugin makes no network requests at runtime
and collects no data. Its only local state is `xmt-skin-prefs` in
`localStorage`, holding your own switch choices; clear it at any time.

**License.** The program code is MIT — see [LICENSE](LICENSE). Use, modify, and
redistribute the code freely, including commercially, provided the copyright and
permission notices are retained.

**Artwork is not MIT.** `assets/splash.mp4`, `assets/bg.mp4`, and `icon.svg` were
created by the project's author and are **all rights reserved**. You may install
and run the skin, and redistribute the package unmodified and complete, but you
may **not** extract the two videos (or parts, re-encodes, or reskins of them) and
re-upload or redistribute them separately, nor use them as background footage in
another project, video, game, application, stream, or template, nor train models
on them. Full terms: [LICENSE-ASSETS.md](LICENSE-ASSETS.md).

Note that the build artifact `lib/client.js` embeds code and artwork together so
the plugin makes no network requests. The artwork restriction is enforced by
this license, not by encryption. If reuse must be impossible rather than merely
prohibited, the only reliable route is to stop shipping the videos and have each
user supply their own footage — at the cost of a skin that shows nothing until
configured.

**Rollback.** Disable or remove the plugin on the app's Plugins page, or run
`dsh plugin --profile <your-profile> remove dsh-skin-xmt-mecha` and drop the
name from the profile's `dsh.profile.bundles`.
