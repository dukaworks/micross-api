# 05 — 前台项目：项目结构与运行逻辑

> 分析日期：2026-09-11
> 对象：`e:\xWorkshop\micross-api\web`
> 业务逻辑见 `06-frontend-business.md`

## 一、技术栈

| 类别 | 技术 | 版本 | 位置 |
|------|------|------|------|
| 框架 | React | `^19.2.7` | `web/package.json:60` |
| 语言 | TypeScript（tsgo / native-preview） | `^7.0.0-dev` | `web/package.json:96` |
| 构建 | Rsbuild 2 + Rspack | `^2.1.4` | `web/package.json:84` |
| 路由 | TanStack Router（文件式） | `^1.170.17` | `web/package.json:37` |
| 数据 | TanStack Query | `^5.101.2` | `web/package.json:36` |
| 状态 | Zustand | `^5.0.14` | `web/package.json:81` |
| HTTP | axios | `^1.18.1` | `web/package.json:44` |
| i18n | i18next + react-i18next | `^26.3.4` / `^17.0.8` | `web/package.json:50,64` |
| 表单 | React Hook Form + Zod | `^7.80.0` / `^4.4.3` | `web/package.json:63,80` |
| 样式 | Tailwind CSS 4 + Base UI | `^4.3.2` / `^1.6.0` | `web/package.json:74,24` |
| 图表 | VChart / Recharts | — | `web/package.json:40,68` |
| 测试 | Vitest + Testing Library | `^4.1.10` | `web/package.json:104` |
| 质量 | oxlint / oxfmt / knip | — | `web/package.json:100-102` |

## 二、构建配置（`web/rsbuild.config.ts`）

| 配置 | 内容 | 行号 |
|------|------|------|
| dev 代理 | `/api`、`/mj`、`/pg` 三个前缀统一转发到 `serverUrl`，`changeOrigin: true` | `:19-24`、`:68-72` |
| 后端地址来源 | `VITE_REACT_APP_SERVER_URL`（进程 env 优先，其次 `env.rawPublicVars`），兜底 `http://localhost:3000` | `:13-16` |
| 插件 | `pluginReact`、`pluginTailwindcss({ optimize:false })` | `:27` |
| 分包 | `splitChunks` preset `default` + 3 个 cacheGroup：`vendor-react`、`vendor-ui-primitives`、`vendor-tanstack`（均 `enforce:true`） | `:29-54` |
| Router 插件 | `tanstackRouter({ target:'react', autoCodeSplitting: isProd })` — **dev 关**（减少白屏、HMR 更快），**生产开**（按路由分块） | `:89-99` |
| 入口 / 模板 | `./src/main.tsx` / `./index.html` | `:55-67` |
| 别名 | `@` → `./src` | `:60-64` |
| 输出 | `dist`；生产 `minify`；`target: web`；保留默认 legalComments（开源合规要求，勿改） | `:73-83` |
| 性能 | 生产 `removeConsole: ['log']`；`buildCache: false` | `:84-88` |
| dev server | `host: '0.0.0.0'`、`strictPort: false`、**未设置 `port`** | `:68-72` |

> **端口提醒**：由于未写死 `port`，`rsbuild dev` 默认用 3000，且 `strictPort: false` 会自动顺延抢占。这就是"前端会跑去占后端端口"的原因，**启动时务必显式 `--port 5173`**。

## 三、目录结构与职责

| 路径 | 职责 |
|------|------|
| `src/features/` | **按业务功能分模块**（23 个），模块内自带 `components/ hooks/ api.ts types.ts` |
| `src/routes/` | TanStack 文件式路由：只放路由骨架与 `beforeLoad` 守卫，页面实现委托给 `features/` |
| `src/components/` | 全局通用组件：`layout/`（布局、页脚、品牌）、`ui/`（UI 原子） |
| `src/lib/` | 基础设施：`http-client.ts`、`auth-session.ts`、`api.ts`、`legacy-route.ts`、格式化与主题工具 |
| `src/stores/` | Zustand 全局状态（3 个，见 `06`） |
| `src/i18n/` | i18next 配置、语言清单、7 个语言包 |
| `src/assets/` | 图标与品牌资产（含 `logo.tsx` SVG 组件） |
| `public/` | 静态资源：`logo.png`、`favicon.ico` 等 |
| `scripts/` | 工程脚本：`sync-i18n.mjs`、`add-copyright.mjs`、`format-with-protected-headers.mjs` |

## 四、路由体系

采用 **TanStack Router 文件式路由**，`src/routes/` 下目录结构即 URL 结构。

| 文件 | 类型 | 作用 |
|------|------|------|
| `routes/__root.tsx` | 根路由 | setup 状态检查 + 会话 bootstrap + 全局 Provider / Toaster / Devtools |
| `routes/_authenticated/route.tsx` | 布局路由（路径下划线前缀，不出现在 URL） | 登录守卫 + `AuthenticatedLayout` |
| `routes/index.tsx` | `/` | 首页（`features/home`） |
| `routes/(auth)/*` | 路由组 | sign-in / sign-up / register / otp / reset / forgot-password / oauth |
| `routes/(errors)/*` | 路由组 | 401 / 403 / 404 / 500 / 503 |
| `routes/setup/index.tsx` | `/setup` | 初始化向导（已完成则反向重定向到 `/`） |
| `routes/_authenticated/dashboard/$section.tsx` | 动态段 | 仪表盘各分节，非法 section 自动重定向 |
| `routes/_authenticated/{channels,keys,users,usage-logs,models,playground,wallet,...}` | 业务页 | 见 `06` 的页面映射 |
| `routes/oauth/$provider.tsx` | 回调 | 第三方登录回调 |
| `routes/{pricing,rankings,about,privacy-policy,user-agreement}` | 公开页 | 无需登录 |

### `__root.tsx` 的职责（关键）

1. **旧路由重定向**：`resolveLegacyRoute(location.href)` 兼容历史路径。
2. **setup 状态检查**：
   - 缓存键 `setup_status_checked`（localStorage，值 `'true'`）+ 模块级内存变量做同会话去重
   - 仅当"未缓存 && 当前路径不是 `/setup`"才调用 `getSetupStatus()`
   - 若 `success && !data.status` → `throw redirect({ to: '/setup' })`；否则写入缓存
3. **会话恢复**：并行执行 `bootstrapAuthentication()`。
4. **全局副作用**：订阅 auth-store 变化（`sid` 变化即 `queryClient.clear()`）、跨标签页登出/换号事件、`useSystemConfig()` 系统配置、`?aff=` 邀请码落盘。
5. `notFoundComponent` / `errorComponent` 分别指向 404 与通用错误页。

### 路由守卫（`beforeLoad`）

| 层级 | 校验 |
|------|------|
| 根级 | 旧路径重定向 → setup 检查 → 会话 bootstrap |
| `_authenticated` | `auth.user` 与 `auth.accessToken` 任一缺失 → `redirect('/sign-in', { search: { redirect: location.href }})` |
| `setup/index.tsx` | 系统已完成初始化 → 重定向 `/`（防止二次进入向导） |

## 五、请求层

### `src/lib/http-client.ts`（axios 实例 `api`）

| 项 | 内容 |
|----|------|
| `baseURL` | `''`（相对同源，由部署层反向代理） |
| `withCredentials` | `true` |
| 默认头 | `Cache-Control: no-store` |
| 请求拦截器 | 从 auth-store 读 `accessToken`，写入 `Authorization: Bearer <token>` |
| 响应拦截器（成功） | `acceptAuthRotation` 时应用令牌轮换；业务失败（`data.success === false`）用 `getServerErrorMessageKey` 映射 i18n key 后 `toast.error`（可用 `skipBusinessError` 跳过） |
| 响应拦截器（失败） | **401**：非 `skipAuthRefresh` 时置 `authRetry` 并调 `refreshAuthentication()`，成功则重试并刷新 Bearer；仍失败或 `anonymous` / `out_of_sync` → toast 提示会话过期 + `clearAuthentication()` + `window.location.replace('/sign-in')`。其他错误按 i18n key 映射后提示 |
| GET 去重 | 重写 `api.get`，按 `sessionSID:url?params` 缓存 in-flight Promise（`disableDuplicate` 可关闭） |
| 扩展配置项 | `skipErrorHandler`、`skipBusinessError`、`disableDuplicate`、`skipAuthRefresh`、`authRetry`、`acceptAuthRotation` |

**鉴权方式：Bearer Token（不是 Cookie）**。`withCredentials` 仅用于会话一致性。

### `src/lib/api.ts`

re-export `api` 与 `auth-session` 方法，并集中定义通用接口（`getSelf`、`getUserModels`、`getUserGroups`、`getStatus`、`getNotice`、2FA 系列）。各业务模块的接口就近放在 `features/<x>/api.ts`。

## 六、启动与构建流程

### 开发（分离模式）

```powershell
# 终端 1 —— 后端
cd e:\xWorkshop\micross-api
go run main.go --port 3001

# 终端 2 —— 前端
cd e:\xWorkshop\micross-api\web
bun run dev --port 5173
```

请求路径：浏览器 → `5173`（rsbuild dev server）→ 匹配 `/api`、`/mj`、`/pg` 前缀 → 代理到 `web/.env` 指定的 `http://localhost:3001`。

### 生产（单进程模式）

```powershell
cd e:\xWorkshop\micross-api\web
bun run build          # 产出 web/dist
cd ..
go run main.go --port 3001
```

`main.go:42-46` 通过 `//go:embed web/dist` 把产物嵌入二进制，后端直接托管页面。**改前端源码后必须重新构建**。

## 七、开发规范与校验

### 脚本清单（`web/package.json`）

| 脚本 | 用途 |
|------|------|
| `dev` / `build` / `preview` | 开发 / 构建 / 预览 |
| `typecheck`（`tsgo -b`） | 类型检查 |
| `build:check` | 类型检查 + 构建 |
| `lint` / `lint:fix`（oxlint） | 静态检查 |
| `format` / `format:check`（oxfmt，保护版权头） | 格式化 |
| `copyright` / `copyright:check` | AGPL 版权头注入 / 校验 |
| `test` / `test:watch`（vitest） | 单元测试 |
| `i18n:sync` | 多语言文案同步 |
| `knip` | 未使用文件 / 依赖检测 |

### 提交前建议执行

```powershell
cd e:\xWorkshop\micross-api\web
bun run typecheck
bun run lint
bun run format:check
bun run build
```

## 八、关键文件速查表

| 路径 | 作用 |
|------|------|
| `src/main.tsx` | 应用入口：QueryClient / Router 装配 |
| `src/routes/__root.tsx` | 根路由：setup 检查（localStorage 缓存）+ 会话 bootstrap |
| `src/routes/_authenticated/route.tsx` | 登录守卫 `beforeLoad` |
| `src/routes/setup/index.tsx` | 初始化向导路由与重定向 |
| `src/lib/http-client.ts` | axios 实例、拦截器、GET 去重、401 刷新 |
| `src/lib/auth-session.ts` | 令牌生命周期（bootstrap / refresh / rotation） |
| `src/lib/api.ts` | 通用 API 与 api / auth 导出 |
| `src/lib/legacy-route.ts` | 旧路由兼容重定向 |
| `src/stores/auth-store.ts` | 登录态 |
| `src/stores/system-config-store.ts` | 系统配置（持久化） |
| `src/stores/notification-store.ts` | 通知已读态（持久化） |
| `src/i18n/config.ts` | i18next 初始化 |
| `src/i18n/languages.ts` | 语言清单与语言码映射 |
| `scripts/sync-i18n.mjs` | 文案同步 / 校验脚本 |
| `rsbuild.config.ts` | 构建与 dev 代理配置 |
| `web/.env` | dev 代理目标（`VITE_REACT_APP_SERVER_URL`） |
