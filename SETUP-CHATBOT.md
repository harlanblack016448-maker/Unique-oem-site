# SETUP-CHATBOT.md — 智能客服 Agent 上线指南（保姆级）

> 站点：https://unique-oem-site.vercel.app · 管理后台：https://unique-oem-site.vercel.app/admin.html
> 架构：Vercel Serverless Functions（`/api/*`，零 npm 依赖）+ 你的 KKAPI（OpenAI 兼容）接口 + Vercel KV 持久化
> 全程只需浏览器操作 Vercel 网页，约 10 分钟。

---

## 一、这套系统包含什么

| 需求 | 实现位置 |
| --- | --- |
| 多轮对话 | `api/chat.js`（保留最近 10 轮上下文，会话存 KV，刷新页面不丢） |
| FAQ 知识库检索 | `api/kb.js`（20 条站内公开事实）+ 关键词检索后注入模型 |
| 意图识别 | 模型自动分类：产品询问 / 订单流程 / 技术支持 / 其他，随回复返回并存档 |
| 无法解决转人工 | 模型判断或用户说"转人工"→ 标记会话 + 自动发邮件到 hanhan@lefu.cc（复用 FormSubmit） |
| 对话历史持久化 | Vercel KV（Upstash Redis），未接 KV 时降级为内存临时存储 |
| 管理后台 | `/admin.html`：对话记录、满意度（👍/👎）、意图分布、转人工筛选 |
| 前端挂件 | `assets/chat-widget.js/.css`，经 `partials.js` 全站注入（含 8-electrode 产品页） |

---

## 二、上线三步（在 Vercel 网页操作）

代码推送后 Vercel 会自动部署一次（此时客服会显示"AI 助手准备中"的降级提示，属正常）。
按下面三步配置完，再点一次 **Redeploy** 即全部生效。

### 第 1 步：创建 KV 数据库（对话持久化）

1. 打开 https://vercel.com → 进入项目 **unique-oem-site**
2. 顶部标签 **Storage** → **Create Database** → 选 **KV**（Upstash 驱动）
3. 名称随意（如 `chat-kv`），地区选离客户近的（欧美买家多选 `iad1` 华盛顿或 `fra1` 法兰克福）
4. 创建后点 **Connect to Project** → 勾选 unique-oem-site → 确认
5. 连接后 Vercel 自动注入 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN` 两个环境变量

> 若你在 Storage 里看到的是"Marketplace"形式，也可选 Upstash 官方集成，效果相同
> （环境变量名会是 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`，代码两种都认）。

### 第 2 步：配置大模型接口（环境变量）

项目 → **Settings** → **Environment Variables**，逐条添加（Environment 勾 Production）：

| Name | Value（示例） | 说明 |
| --- | --- | --- |
| `LLM_API_BASE` | `https://ai-api.kkidc.com/v1` | 你的 KKAPI 接口地址，保留 `/v1` 结尾 |
| `LLM_API_KEY` | `sk-…`（你的完整 KKAPI key） | 不要泄露；只存 Vercel |
| `LLM_MODEL` | 填你 KKAPI 套餐里可用的对话模型名 | 代码默认 `gpt-4o-mini`；用 Claude 就填如 `claude-sonnet-4-5` 之类 KKAPI 文档给出的模型名 |
| `ADMIN_TOKEN` | 自己编一个强口令，如 `us-admin-9f2k7x…` | 管理后台的唯一凭据，忘了就回来这里看 |

保存后 → **Deployments** 标签 → 最新一条右侧 ⋯ → **Redeploy**（勾掉 "Use existing Build Cache" 不必，直接点）。

### 第 3 步：验收清单（逐项打勾）

- [ ] 打开 https://unique-oem-site.vercel.app/products/8-electrode ，右下角出现黑色圆形聊天气泡
- [ ] 点开 → 有欢迎语 → 点快捷提问「MOQ?」→ 数秒内返回正确答案（浴室/厨房秤 1000 起，8 电极首单 500 起）
- [ ] 问一个知识库没有的问题（如「Can you ship to Mars?」）→ 回复表示会转人工 + 出现「Email us / Request a quote」按钮
- [ ] 对任意 AI 回复点 👍 → 出现"感谢反馈"
- [ ] 刷新页面再打开聊天 → 历史对话还在（多轮上下文 + 本地会话保持）
- [ ] 打开 https://unique-oem-site.vercel.app/admin.html → 输入 `ADMIN_TOKEN` → 能看到刚才的会话、意图分布、满意度统计；「待人工跟进」筛选能看到刚才的转人工会话
- [ ] 收件箱 hanhan@lefu.cc 收到 `[AI Chat] Human follow-up needed` 邮件
- [ ] 手机上打开产品页 → 挂件在右下角正常弹出，不遮挡中间的 Request a Quote 悬浮条

---

## 三、日常维护

| 想改什么 | 改哪里 |
| --- | --- |
| FAQ 知识库内容 | `api/kb.js`（只加站内公开事实；红线：不写 UL、不写价格、不写独家代理） |
| 客服开场白/快捷提问/文案 | `assets/chat-widget.js` 顶部的 `T` 字典（en/zh 两份） |
| 挂件样式 | `assets/chat-widget.css` |
| 改了 `chat-widget.js` 之后 | 同步把 `assets/partials.js` 里的 `chat-widget.js?v=1` 升一位（如 `?v=2`），否则老访客拿缓存 |
| 改了系统提示词/红线 | `api/chat.js` 的 `buildSystemPrompt` |

## 四、常见问题

- **问什么都是"AI 助手准备中"** → `LLM_API_BASE` / `LLM_API_KEY` 没配好，或没 Redeploy。Vercel → Settings → Environment Variables 核对。
- **报模型错误 / 一直转人工** → `LLM_MODEL` 名字不在你 KKAPI 套餐内，换一个模型名再 Redeploy。
- **后台显示黄色横幅"内存临时存储"** → KV 没连上：重走第 1 步，连接后必须 Redeploy 才会注入变量。
- **转人工邮件没收到** → 会话仍会标「转人工」并在后台可见，不丢线索；检查 FormSubmit 对 hanhan@lefu.cc 的激活状态即可。
- **成本** → 每轮对话约 1.5–2.5K tokens（知识库检索后注入），按你的 KKAPI 套餐单价折算；建议日后在 KKAPI 后台设月度上限。

## 五、涉及文件

```
api/_lib.js          公共库：KV REST 封装 / LLM 调用 / 限流 / 转人工邮件（零 npm 依赖）
api/kb.js            FAQ 知识库（20 条，站内公开事实）
api/chat.js          POST /api/chat  多轮对话 + 意图识别 + 转人工
api/feedback.js      POST /api/feedback  满意度 👍/👎
api/admin.js         GET  /api/admin   后台数据（令牌校验）
assets/chat-widget.js / .css          前端挂件
admin.html           管理后台页面（noindex，robots 已屏蔽）
assets/partials.js   全站注入挂件（loadChatWidget，v=17 起）
SETUP-CHATBOT.md     本文件
```
