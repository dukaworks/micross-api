# 06 — 前台项目：业务逻辑

> 分析日期：2026-09-11
> 结构与构建配置见 `05-frontend-structure.md`

## 一、状态管理

### Zustand（全局客户端状态，3 个）

| Store | 管理内容 | 持久化 |
|-------|---------|--------|
| `src/stores/auth-store.ts` | `auth`：`user` / `accessToken` / `accessExpiresAt` / `session` / `pending2FAFlowToken` / `bootstrapState`，含 `setBundle` / `setUser` / `reset` | 否（内存） |
| `src/stores/system-config-store.ts` | 系统配置：`systemName` / `logo` / `footerHtml` / `currency` | 是 → `system-config-storage` |
| `src/stores/notification-store.ts` | 通知已读态：`lastReadNotice` / `readAnnouncementKeys` / `closedUntilDate` | 是 → `notification-storage` |

### TanStack Query（服务端状态）

`main.tsx` 中创建 `QueryClient`，全局策略：

| 策略 | 值 |
|------|-----|
| `staleTime` | 10 秒 |
| `refetchOnWindowFocus` | `false` |
| retry | 遇 401 / 403 不重试 |
| mutation `onError` | `handleServerError` |
| QueryCache | 遇 500 → toast + 跳 `/500` |

**约定**：

- queryKey 是**字符串数组**，按域加前缀：`['system-options']`、`['status']`、`['logs']`、`['usage-logs-stats', ...]`、`['dashboard','overview','api-keys']`、`['setup-status']`、`['groups']`、`['channel_models']`，参数拼在 key 之后
- **没有全局统一 query hook**，按 feature 就近封装：`features/<x>/hooks/use-*.ts`、`features/<x>/api.ts`、`lib/*-actions.ts`
- mutation 成功后手动 `queryClient.invalidateQueries({ queryKey })`

## 二、鉴权与会话

```
登录 → 拿到 accessToken + session
     ↓
存放 auth-store（内存，不落 localStorage）
     ↓
每次请求由 http-client 请求拦截器注入 Authorization: Bearer <token>
     ↓
401 → 自动 refreshAuthentication() → 重试原请求
     ↓
刷新失败 / anonymous / out_of_sync → 清空认证 + 跳转 /sign-in
```

| 机制 | 说明 |
|------|------|
| 令牌存储 | 仅内存（`auth-store`），不使用 localStorage 存放 token |
| 令牌生命周期 | `src/lib/auth-session.ts` 负责 bootstrap / refresh / rotation |
| 跨标签同步 | `subscribeAuthSessionEvents` 监听跨标签页的登出与换号 |
| 会话变更清理 | `sid` 变化时 `queryClient.clear()`，避免脏数据 |
| 登录守卫 | `routes/_authenticated/route.tsx` 的 `beforeLoad`，未登录重定向并携带 `redirect` 回跳地址 |

## 三、国际化

| 项 | 内容 |
|----|------|
| 初始化 | `src/i18n/config.ts`（由 `main.tsx` 引入） |
| 语言包 | `src/i18n/locales/{en,zh,zh-TW,fr,ru,ja,vi}.json` |
| 语言清单 | `en`（回退）、`zhCN`、`zhTW`、`fr`、`ru`、`ja`、`vi`；定义在 `src/i18n/languages.ts` |
| 键的写法 | `translation` 命名空间下，**键即英文原文**（如 `"Session expired!"`）；`nsSeparator: false` 允许键中含冒号 |
| 静态键注册 | `src/i18n/static-keys.ts` 存放静态扫描到的键 |
| 语言检测 | `i18next-browser-languagedetector`，顺序 `localStorage` → `navigator`；`convertDetectedLanguage` 把 `zh-CN` / `zh-TW` 映射为 `zhCN` / `zhTW` |
| 使用方式 | 组件内 `const { t } = useTranslation()` → `t('English key')` |

### `scripts/sync-i18n.mjs` 的行为

1. 自动挑选"叶子键最多"的语言包作为基准
2. 按基准重排所有语言包的键顺序，并补齐缺失键
3. 多余键导出到 `_extras/<lang>.extras.json`
4. 检测仍为英文（疑似未翻译）的项，输出到 `_reports/<lang>.untranslated.json`
5. 生成汇总报告 `_reports/_sync-report.json`

> 新增文案的标准流程：组件里先写 `t('English text')` → 运行 `bun run i18n:sync` → 补齐各语言翻译。

## 四、核心功能模块（`src/features/`，23 个）

| 模块 | 职责 |
|------|------|
| `about/` | 关于页 |
| `auth/` | 登录 / 注册 / OAuth / 2FA |
| `channels/` | 渠道管理（增改、测试、余额、多 key、标签） |
| `chat/` | 对话（chat2link / chatId） |
| `dashboard/` | 数据仪表盘（overview / models / flow / users 分节） |
| `errors/` | 通用与 404 错误页 |
| `home/` | 首页落地（hero / features / how-it-works / stats / cta） |
| `keys/` | API 令牌管理 |
| `legal/` | 隐私政策 / 用户协议 |
| `models/` | 模型、部署、厂商、同步 |
| `performance-metrics/` | 性能指标 |
| `playground/` | 在线体验（对话、输入、消息、参数面板） |
| `pricing/` | 定价与模型详情 |
| `profile/` | 个人资料、登录会话、签到 |
| `rankings/` | 排行榜 |
| `redemption-codes/` | 兑换码 |
| `setup/` | 安装向导 |
| `subscriptions/` | 订阅计划 |
| `system-info/` | 系统信息 / 任务 / 实例 |
| `system-settings/` | 系统设置（auth / billing / content / models / security / site / operations 七分组） |
| `usage-logs/` | 用量日志（含 admin / common / task 视图） |
| `users/` | 用户管理 |
| `wallet/` | 钱包 / 充值 |

## 五、页面与路由映射（重点模块）

| 路由 | 入口组件 | 说明 |
|------|---------|------|
| `/` | `features/home/index.tsx` | 首页，分节组件在 `components/sections/` |
| `/dashboard/:section` | `features/dashboard/index.tsx` | 仪表盘；**系统设置实际归属 `features/system-settings/`**，按七个分组切换 section |
| 渠道 | `features/channels/` | 渠道 CRUD、测试、余额查询 |
| 令牌 | `features/keys/` | API 令牌管理 |
| 用户 | `features/users/` | 用户管理 |
| 日志 | `features/usage-logs/` | 用量日志与统计 |
| `/playground` | `features/playground/index.tsx` → `components/chat/playground-chat.tsx` | 在线体验 |
| `/setup` | `features/setup/setup-wizard.tsx` | 初始化向导 |

## 六、Setup 初始化向导

**入口**：`src/features/setup/setup-wizard.tsx`，步骤组件在 `components/`（`admin-step`、`usage-mode-step`、`database-step`、`complete-step`、`step-navigation`）。

| 项 | 说明 |
|----|------|
| 状态查询 | `features/setup/api.ts` 的 `getSetupStatus()` → `GET /api/setup`，queryKey 为 `['setup-status']` |
| 步骤 1 | 管理员账号（`root_init` 为 true 时跳过，复用已有账号） |
| 步骤 2 | 使用模式（外部 / 自用 / 演示） |
| 步骤 3 | 完成确认（展示 `database_type` 等信息） |
| 提交 | `POST /api/setup` |
| 后端校验 | 用户名 ≤ 12 字符；密码 ≥ 8 字符且两次一致 |
| 提交后 | 后端写入 `setups` 表并置 `constant.Setup = true`；前端清除 `setup_status_checked` 缓存 |

## 七、改造注意点

1. **文案必须国际化**：不得在组件里硬编码面向用户的中文/英文，统一 `t('English key')` 并跑 `i18n:sync`。
2. **品牌相关文案与资产**：系统名称、Logo、页脚等已支持后台配置（`system-config-store` + 系统设置 → site 分组），改动品牌优先走配置项而非硬编码。注意 `AGENTS.md` 定义的上游保护信息（项目名、组织名、版权）不得修改。
3. **新增页面**：在 `src/features/` 建模块（含 `index.tsx`），再在 `src/routes/` 加路由文件，页面实现不要写进 `routes/`。
4. **接口调用**：统一走 `src/lib/http-client.ts` 的 `api` 实例，不要新建 axios 实例；业务接口就近放 `features/<x>/api.ts`。
5. **需要登录的页面**：放在 `routes/_authenticated/` 下，自动获得登录守卫。
6. **`web/public/logo.png` 与 `web/public/favicon.ico`** 已替换为 Microsslink 品牌资产，替换时保持尺寸（logo 180×180）。
7. **构建产物**：`web/dist` 不提交，但后端 `go:embed` 依赖它，CI / 本地构建顺序必须是"先 `bun run build`，再 `go build`"。
