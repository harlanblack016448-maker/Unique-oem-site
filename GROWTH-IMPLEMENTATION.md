# 八电极广告专页与询盘归因 — 2026-10-09

本报告记录本地实现与模拟验收；验收时尚未推送、部署、发布广告或发送真实邮件。

2026-10-09 发布准备：用户已授权推送 GitHub main。推送副本已合并远端厨房秤配图及 CSP 修正；内容目录未获回写权限，后续维护应先核对并同步两个副本。GitHub 发布与 Vercel 部署验收分别记录。

## 使用入口

专页文件：`solutions/8-electrode-oem.html`；生产 clean URL：`/solutions/8-electrode-oem`。
默认英文；`lang=zh` 可指定中文。页内切换不覆盖其他页面的语言偏好。

- 广告 A：`https://unique-oem-site.vercel.app/solutions/8-electrode-oem?lang=en&utm_source=linkedin&utm_medium=paid_social&utm_campaign=8electrode_us_test_202610&utm_content=fingerprint_a`
- 广告 B：`https://unique-oem-site.vercel.app/solutions/8-electrode-oem?lang=en&utm_source=linkedin&utm_medium=paid_social&utm_campaign=8electrode_us_test_202610&utm_content=oem_options_b`

以上是待部署后使用的链接，现在不代表该路径在线可用。首轮预算约 $800/28 天，广告实际配置另行操作。

## 行为与接口

- 原生 HTML/CSS/JS，无构建依赖；询盘仍通过现有 FormSubmit，无后端 API 变更。
- `assets/growth.js` 暴露 `window.__us_growth`：同意状态、会话来源、询盘元信息及去重转化调用。Partner ID 9831228；Conversion ID 28515124 沿用本地配置，尚未确认广告账户配置。
- 同意键 `us_ads_consent`：版本 1，有效期 180 天；来源键 `us_ads_source` 仅使用 sessionStorage。未知/拒绝不存广告来源、不加载领英、不排队事件。
- 已同意时保留最近一次含 UTM 的访问，普通站内跳转不覆盖。未同意时只有当前表单 URL 中的 UTM 能随询盘提交；跨页后无法推断来源。
- FormSubmit 新增字段：五个 UTM 字段、source_status、landing_path、inquiry_path、submitted_at、inquiry_id。没有来源时 source_status=unknown。
- 未额外收集完整 URL、客户身份参数或任意查询字段；仅将这些来源字段作为纯文本提交，不用于动态设置 action、收件人或邮件主题。
- 来源存储被阻止时降级为当前页来源，不影响表单。当前页参数与额外路径均有长度限制。
- 专页必填姓名/公司/邮箱/需求类型，型号及采购量可为 unknown。首页和联系页仍使用原来的必填规则。
- 服务回执确认后才显示成功；有提交时同意与成功时同意、且同一编号尚未上报才报 Lead。事件不包含姓名、邮箱或需求正文。失败重试沿用编号，下一次成功后重新生成编号；仅前端去重，不保证服务端幂等。
- 无追踪同意的成功询盘不会在后来同意时补报。统计异常不改变询盘成功状态。
- 撤回清除会话来源，停止排队与新事件，并刷新以卸载领英脚本。已发送的数据不能追回；未尝试清除无法访问的第三方 Cookie。
- 全站删除绕过同意的静态和动态 noscript 广告像素，保留既有 Vercel Web Analytics。页脚提供隐私设置。

## 素材与事实

沿用 PHOTO-SOURCES.md 记录的 260827 画册素材：封面产品组合、CF658（p7）、CF689（p10）、CF625 标准版（p14）。没有扩大型号库、生成或改绘产品。
对比报告覆盖 CF597/CF661/CF625，不作为 CF658/CF689 或整个系列验证。价格、样品费用、交期、认证及软件范围按具体项目确认。

## 本地验证

- Python：27 项通过；Node：21 项通过（原有 38 项均保留，新增 10 项）。
- 脚本语法检查和页面链接/图片/语言键检查通过。
- 浏览器：390/768/1440 像素，中英文完整页面截图见 `qa/growth/ad-{en,zh}-{width}.jpg`；无横向溢出，桌面确认已加载图片无缺失。
- 浏览器确认型号按钮预选 CF658，切换中文保留姓名/公司/邮箱/型号/采购量，默认专页重载英文。
- 拒绝追踪：成功模拟提交，未知采购量可提交，脚本与事件均为 0。
- 接受后跨页：专页 → 联系页，载荷保留活动/素材/专页 landing_path，inquiry_path 为联系页；成功模拟事件为 1。
- 模拟失败：不清空输入，事件不增加，邮件备用内容包含同样的来源字段和编号；模拟重试沿用编号并成功。
- 撤回刷新：脚本与事件均为 0。键盘 Tab 可在接受与拒绝间移动，Enter 可拒绝。空表单显示姓名/公司/邮箱错误并聚焦首个错误。
- `scripts/qa-growth-server.py` 仅监听 127.0.0.1:8092。它在内存中替换 FormSubmit/领英和邮件兜底，CSP 阻止外部服务，不改变生产文件的服务地址。截图底部 LOCAL QA 是测试服务插入的标识，线上页面没有它。

运行：`python3 scripts/qa-growth-server.py`，访问 `http://127.0.0.1:8092/solutions/8-electrode-oem?lang=en`。标准静态预览可使用原有服务器与 `.html` 路径；clean URL 由 Vercel 提供。

销售模板：`qa/growth/sales-followup.csv`（UTF-8 BOM，空表，不含虚构客户）。新增中英文文案：`qa/growth/bilingual-copy.csv`；原 TRANSLATION-REVIEW.md 仍为历史审核，不宣称覆盖本轮新增词条。

## 上线前待完成

1. 经授权审核后从指定 oem-site-git 推送副本发布，不从内容目录直接 push。此次尚未同步副本。
2. 确认 Campaign Manager 中 Partner/Conversion ID 的归属、Lead 类别、事件状态与广告关联。将“按钮点击”与“询盘成功”分开，避免双计。
3. 经授权做一次标记清楚的受控询盘，核验真实 FormSubmit 回执、销售邮箱收件/垃圾邮件、来源字段和编号。
4. 在真实部署核验 clean URL、CSP、接受前无领英请求、接受后标签加载，以及撤回后的停止行为。
5. 检查目标地区广告追踪及表单信息处理要求；本实现不是完整法律合规认证。
6. 对比销售邮件、领英转化和合格线索数量；同意选择、拦截和归因规则导致统计差异时不伪造对齐。

验收结论：页面/来源载荷/前端事件的本地模拟链路已通过。真实邮件送达、领英账户接收、生产部署尚未验证。
