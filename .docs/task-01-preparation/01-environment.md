# 01 — 运行环境准备

> 整理日期：2026-09-11
> 整合来源：`.docs/env/setup.md`（原始记录）+ 本轮复核
> 目标：任何人按本文可从零把前后端跑起来

## 一、结论速览

| 组件 | 要求 | 本机实际情况 | 状态 |
|------|------|-------------|------|
| Go | `go.mod` 声明 1.25.1 | go1.27.0 windows/amd64 | ✅ |
| Bun | 前端包管理器（优先于 npm/yarn/pnpm） | 1.3.10 | ✅ |
| Node | 前端运行时 | v23.1.0 | ✅ |
| GOPROXY | 国内加速 | `https://mirrors.aliyun.com/goproxy/,direct` | ✅ |
| Go 模块缓存 | — | `D:/xDev-Cache/go/pkg/mod` | ✅ |
| 数据库 | 默认 SQLite，无需额外服务 | `one-api.db`（项目根目录） | ✅ |
| 缓存 | 单机可用内存缓存，无需 Redis | `MEMORY_CACHE_ENABLED=true` | ✅ |

## 二、端口约定

| 用途 | 端口 | 指定方式 |
|------|------|---------|
| 后端 HTTP 服务 | **3001** | 启动参数 `--port 3001` |
| 前端 dev server | **5173** | `bun run dev --port 5173` |

**背景说明**：本机 3000 端口原本被另一工作区的常驻服务占用（`E:\xworkshop\new-api\bin\new-api.exe`，PID 68828，2026-08-29 启动），因此本项目把开发端口整体后移。该进程已于 2026-09-11 停止，**但项目仍沿用 3001 / 5173 的约定**（已固化在 `web/.env`，用户已确认保持）。

> 两个易被忽略的点：
> - 后端端口**只由 `--port` 参数决定**，`.env` 里的 `PORT` 不生效（`common/init.go:19` 的 flag 默认值为 3000）。
> - 前端 `rsbuild.config.ts` 的 `server` 段**没有写死 `port`**，因此不加 `--port` 时默认也想用 3000，且 `strictPort: false` 会自动顺延抢占，容易和后端抢端口。**两端都要显式指定**。

## 三、关键配置文件

两个文件都是**本地开发专用、已被 `.gitignore` 忽略**（项目原有的是 `.env.example`）：

### 根目录 `.env`

| 配置 | 值 | 作用 |
|------|-----|------|
| `DEBUG` | `true` | 开启调试日志、Gin debug 模式 |
| `MEMORY_CACHE_ENABLED` | `true` | 使用内存缓存，单机免 Redis |

数据库未配置 `SQL_DSN`，因此自动落到 SQLite（根目录 `one-api.db`）。

### `web/.env`

```
VITE_REACT_APP_SERVER_URL=http://localhost:3001
```

`web/rsbuild.config.ts:19-24,68-72` 会把 `/api`、`/mj`、`/pg` 三个前缀代理到该地址。**前端代理目标与后端实际端口必须一致**，否则浏览器控制台会持续刷 `[HPM] Error occurred while proxying request`（连接被拒）。

## 四、首次准备步骤

```powershell
cd e:\xWorkshop\micross-api

# 1. 后端依赖
go mod download

# 2. 前端依赖
cd web; bun install; cd ..

# 3. 前端生产构建（必须先做，见下方注意事项）
cd web; bun run build; cd ..
```

## 五、启动方式

### 方式 A：前后端分离（推荐，前端有 HMR）

```powershell
# 终端 1 —— 后端（端口 3001）
cd e:\xWorkshop\micross-api
go run main.go --port 3001

# 终端 2 —— 前端 dev server（端口 5173）
cd e:\xWorkshop\micross-api\web
bun run dev --port 5173
```

访问 http://localhost:5173

### 方式 B：单进程（后端直接托管前端静态产物）

`main.go` 通过 `//go:embed web/dist` 嵌入前端产物，构建后单端口即可访问：

```powershell
cd e:\xWorkshop\micross-api
cd web; bun run build; cd ..
go run main.go --port 3001
```

访问 http://localhost:3001

> 方式 B 下，**每次修改前端源码都必须重新 `bun run build`** 才生效。

## 六、常用校验命令

```powershell
# 后端编译（需先存在 web/dist）
cd e:\xWorkshop\micross-api
go build ./...

# relaykit 独立构建（规范强制要求）
cd e:\xWorkshop\micross-api\relaykit
$env:GOWORK="off"; go build ./...

# Go 单元测试
cd e:\xWorkshop\micross-api
go test ./...
cd relaykit; $env:GOWORK="off"; go test ./...

# 前端类型检查 / 构建 / 测试 / 规范
cd e:\xWorkshop\micross-api\web
bun run typecheck
bun run build
bun run test
bun run lint
bun run format:check
```

## 七、常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| `failed to start HTTP server: listen tcp :3000: bind: Only one usage of each socket address` | 3000 被其它进程占用 | 改用 `--port 3001`，或用 `netstat -ano \| findstr :3000` 定位占用进程 |
| `pattern web/dist: no matching files found` | `web/dist` 不存在 | 先执行 `cd web; bun run build` |
| 浏览器控制台刷 `[HPM] Error occurred while proxying request %s to %s` | 后端未启动，或前端代理地址与后端端口不一致 | 确认后端已在 `web/.env` 指定的端口上监听 |
| 登录 `root / 123456` 失败 | 本版本已取消自动创建 root 账号 | 走 Setup 初始化向导（见下节） |
| 访问页面被强制跳转到初始化页 | 系统尚未完成初始化 | 正常行为，完成向导即可 |

## 八、首次初始化（必读）

本版本**首次启动只建表、不创建管理员账号**：`model/main.go:57` 的 `createRootAccountIfNeed()` 已废弃且全仓库无调用点，改由 Setup 向导负责。

- 判定接口：`GET /api/setup` → 未初始化时返回 `{"status":false,"root_init":false,"database_type":"sqlite"}`
- 完成方式：前端访问时自动进入向导（`web/src/features/setup/setup-wizard.tsx`），或直接 `POST /api/setup`
- 校验规则：**用户名 ≤ 12 字符，密码 ≥ 8 字符**
- 完成后：写入 `setups` 表，`constant.Setup` 置为 `true`

## 九、验证记录

```
日期        2026-09-11
后端        go build ./... 通过；relaykit 独立构建通过
前端        bun run typecheck 通过；bun run build 通过
启动冒烟    --port 3001 启动正常
GET /api/status   -> HTTP 200, system_name=Microsslink
GET /api/setup    -> {"status":false,"root_init":false,"database_type":"sqlite"}
数据库       SQLite 自动建库，迁移成功，34 张表
```

## 十、明确的注意事项

1. **不要删除 `.docs/`**：这是本项目约定的工作文档目录。
2. `.env`、`one-api.db`、`logs/`、`web/dist`、`web/node_modules` 均在 `.gitignore` 中，不会被提交。
3. 首次运行后端会在根目录生成 `one-api.db` 并执行自动迁移。
4. `VERSION` 文件当前为**空**，会导致前端构建注入的版本号为空；版本号规范见 `.docs/governance/version-policy.md`。
