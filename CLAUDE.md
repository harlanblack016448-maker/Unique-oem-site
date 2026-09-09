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

## 当前状态（2026-09-09）
- AI 客服已上线并验收：widget v5 / css v3 / partials v21；FOUC 防闪烁 = CSS 并行预载 + 关键帧淡入
- 知识库口径：认证 = CE/RoHS/FCC/ISO9001 等齐全、部分市场可配合申请；交期 = 首单 45-50 天、返单 30-35 天
- 待办：oem-landing 内 2026-09-02 前的内容改动（i18n.js / style.css / vercel.json / sitemap.xml / 部分图片与文案）仍未同步线上，待用户确认后经 oem-site-git 推送

## 已知坑
- Vercel 对脚本化客户端（curl/python/WebFetch）会下发 Security Checkpoint（即使防火墙全关）；远程验收优先浏览器侧，或预期间歇 403
- zsh 下 curl 的 URL 带 `?` 必须加引号
- oem-site-git 的 `.git` 常被编辑器抢 `index.lock`：提交用「清锁 + 重试」；部署状态以 `gh api repos/harlanblack016448-maker/Unique-oem-site/commits/main` 为准
