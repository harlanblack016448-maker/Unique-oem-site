# CLAUDE.md — Unique Scales OEM/ODM 站（unique-oem-site）

## 定位
深圳 Unique Scales（乐福衡器）面向海外 OEM/ODM 买家的中英双语获客站 + AI 客服。
线上：https://unique-oem-site.vercel.app · 仓库：`harlanblack016448-maker/Unique-oem-site`

## 怎么跑
- 本地预览：`python3 -m http.server 8090`（纯静态；`/api` 需 Vercel 环境，本地 404 属正常）
- 部署：push 到 GitHub `main` → Vercel 自动部署（preset "Other"，零构建）
- **推送工作副本**：`/Users/harlan/Workbuddy/2026-08-10-14-49-50/oem-site-git`（干净克隆）
- **内容工作副本**：同目录 `oem-landing`（本地 git 与远端已分叉，**勿从那里 push**，只当内容源）

## 技术栈
- 原生 HTML/CSS/JS，零 npm 依赖，无构建步骤；字体 IBM Plex Sans；i18n 走 `localStorage["us_lang"]` + `__us_getLang()`
- 后端：`/api/*.js` Vercel Serverless Functions（Node，零依赖 fetch）
  - LLM：环境变量 `LLM_API_BASE` / `LLM_API_KEY` / `LLM_MODEL`（OpenAI 兼容，走 KKAPI）
  - 存储：Upstash Redis（Vercel Storage 集成，`KV_REST_API_URL` / `KV_REST_API_TOKEN`）
  - 转人工：FormSubmit 邮件 → hanhan@lefu.cc；后台 `/admin.html`（`ADMIN_TOKEN` 令牌，noindex）

## 目录与约定
- `assets/partials.js` 全站注入导航/页脚/挂件；**改任何 js/css 必须同步升 `?v=` 版本号**：partials 自身变化 → 9 个页面全升；挂件/样式变化 → 升 partials 里的引用
- `api/kb.js` 知识库：只写站内公开事实；**红线：不宣称 UL、不报价、不谈独家代理**
- 配置指南：`SETUP-CHATBOT.md`；设计规范：`design/TRACE.md`（动效 ≤300ms，easing tokens only）

## 当前状态（2026-09-10）
- AI 客服已上线并验收：widget v6 / css v3 / partials v23；FOUC 防闪烁 = CSS 并行预载 + 关键帧淡入
- 知识库口径：认证 = CE/RoHS/FCC/ISO9001 等齐全、部分市场可配合申请；交期 = 首单 45-50 天、返单 30-35 天
- 资源版本（本地待发布）：`style.css?v=26` · `i18n.js?v=23` · `partials.js?v=23` · `chat-widget.js?v=6` · `form.js?v=8`
- **战略：站点只做「施工」（能被找到 / 能被测量 / 能被信任），不做「美化」。** 依据 = 2026-09-10 用户确认「无投流、实际无客户访问」→ 约束是流量，不是站点；零流量下站点优化的边际收益为 0。完整计划见上级目录 `GROWTH-PLAN.md`
- 待办：**换掉 `unique-oem-site.vercel.app` 域名**（唯一硬阻塞）。一键脚本 = 上级目录 `set-domain.sh <新域名> [--apply]`，覆盖 36 处 / 16 个文件

## 变更（2026-09-10）
- **修 `robots.txt`**：原 `Disallow: /privacy.html` / `/admin.html` 在 `cleanUrls: true` 下**实际不生效**（真实路径已变为 `/privacy`、`/admin`），已改为无后缀路径
- **修 `sitemap.xml`**：原 8 条中 7 条是 `.html` 地址，但 cleanUrls 使其全部 308 跳转（实测 `/about.html` → `/about`）；已改为干净 URL，并移除与 robots 冲突的 privacy 条目
- **统一 `i18n.js?v=`**：about / capabilities / contact / privacy / 404 / kitchen 原为 `v=18`，与其余页面不一致（同一文件被缓存两份），统一为 `v=21`
- **加埋点**：9 个公开页面注入 `<script defer src="/_vercel/insights/script.js">`（Vercel Web Analytics，无 Cookie → 免 GDPR 同意横幅）。**需在 Vercel 面板 Real Insights → Web Analytics 开启后才会真正采集**
- **`assets/form.js`**：新增 `LI_CONVERSION_ID` 常量 + `trackLeadConversion()`，挂在提交成功分支。**留空即不触发**；填入 LinkedIn Campaign Manager 生成的转化 ID 即生效。注意它只在 FormSubmit 回执成功时触发，走 mailto 兜底的提交不计入转化（保守口径，避免污染投放优化信号）
- 版本 bump：`form.js?v=6 → v=7`（index / contact 两页）

## 已知坑
- Vercel 对脚本化客户端（curl/python/WebFetch）会下发 Security Checkpoint（即使防火墙全关）；远程验收优先浏览器侧，或预期间歇 403
- zsh 下 curl 的 URL 带 `?` 必须加引号
- oem-site-git 的 `.git` 常被编辑器抢 `index.lock`：提交用「清锁 + 重试」；部署状态以 `gh api repos/harlanblack016448-maker/Unique-oem-site/commits/main` 为准
