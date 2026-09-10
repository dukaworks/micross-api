# MicrossAPI 运行环境准备说明

> 记录时间：2026-09-11
> 工作区：`e:\xWorkshop\micross-api`

## 一、环境清单与结论

| 组件 | 要求 | 本机版本 | 状态 |
|------|------|---------|------|
| Go | go.mod 声明 1.25.1 | go1.27.0 windows/amd64 | ✅ |
| Bun | 前端包管理器 | 1.3.10 | ✅ |
| Node | 前端运行时（Bun 兼容） | v23.1.0 | ✅ |
| Go 模块缓存 | — | `D:/xDev-Cache/go/pkg/mod` | ✅ |
| GOPROXY | — | `https://mirrors.aliyun.com/goproxy/,direct` | ✅ |

已完成的准备工作：

1. `go mod download` —— 后端依赖下载完成（exit 0）
2. `bun install`（web/）—— 前端依赖安装完成（1191 packages）
3. 创建后端 `.env`（本地开发配置）
4. 创建前端 `web/.env`（dev 代理目标）
5. 前端生产构建 `bun run build` —— 生成 `web/dist`（Go 用 `go:embed` 嵌入，必须先构建）
6. `go build ./...` —— 根模块编译通过
7. `cd relaykit && GOWORK=off go build ./...` —— relaykit 独立模块编译通过
8. `bun run typecheck` —— 前端类型检查通过
9. 后端启动冒烟测试 —— `/api/status` 返回 200，SQLite 建库/迁移/系统任务正常

## 二、端口占用情况（重要）

本机 **3000 端口已被其它工作区的服务长期占用**，不是本项目：

| 端口 | 占用进程 | 路径 | 启动时间 |
|------|---------|------|---------|
| 3000 (IPv6) | `new-api.exe` (PID 68828) | `E:\xworkshop\new-api\bin\new-api.exe` | 2026-08-29 |
| 3000 (IPv4) | `node.exe` (PID 50788) | `E:\Node.JS\node.exe` | 2026-08-29 |

**处理方式**：本项目开发统一使用以下端口，避免干扰已有服务。

| 用途 | 端口 | 说明 |
|------|------|------|
| 后端 API | **3001** | `--port 3001` 指定 |
| 前端 dev server | **5173** | Rsbuild 默认 3000 会冲突，需显式指定 |

> 如需改回 3000，请先停止 `E:\xworkshop\new-api` 的服务，并同步修改 `web/.env` 中的 `VITE_REACT_APP_SERVER_URL`。

## 三、关键配置文件

### 后端 `.env`（项目根目录，已被 .gitignore 忽略）
- `DEBUG=true`：开启调试日志
- `MEMORY_CACHE_ENABLED=true`：使用内存缓存，单机开发无需 Redis
- 数据库默认 SQLite，文件为根目录 `one-api.db`
- 注意：后端端口由启动参数 `--port` 决定，`.env` 里的 `PORT` 不生效

### 前端 `web/.env`（已被 web/.gitignore 忽略）
```
VITE_REACT_APP_SERVER_URL=http://localhost:3001
```
Rsbuild dev server 会把 `/api`、`/mj`、`/pg` 代理到该地址（见 `web/rsbuild.config.ts`）。

## 四、启动命令

### 方式 A：前后端分离（推荐，前端有 HMR）

```powershell
# 终端 1 —— 后端（端口 3001）
cd e:\xWorkshop\micross-api
go run main.go --port 3001

# 终端 2 —— 前端 dev server（端口 5173）
cd e:\xWorkshop\micross-api\web
bun run dev -- --port 5173
```

访问 http://localhost:5173

### 方式 B：单进程（后端直接托管前端静态产物）

需先构建前端，后端会把 `web/dist` 嵌入并提供页面：

```powershell
cd e:\xWorkshop\micross-api
cd web; bun run build; cd ..
go run main.go --port 3001
```

访问 http://localhost:3001

> 注意：修改前端源码后，方式 B 必须重新 `bun run build` 才生效。

## 五、常用校验命令

```powershell
# 后端编译（需先存在 web/dist）
cd e:\xWorkshop\micross-api
go build ./...

# relaykit 独立构建（规范要求）
cd e:\xWorkshop\micross-api\relaykit
$env:GOWORK="off"; go build ./...

# Go 单元测试
cd e:\xWorkshop\micross-api
go test ./...                       # 根模块
cd relaykit; GOWORK=off go test ./...   # relaykit

# 前端类型检查 / 构建 / 测试
cd e:\xWorkshop\micross-api\web
bun run typecheck
bun run build
bun run test

# 前端 Lint / 格式检查
bun run lint
bun run format:check
```

## 六、注意事项

1. **`web/dist` 必须先构建**：`main.go` 使用 `//go:embed web/dist` 与 `web/dist/index.html`，缺失时 `go build ./...` 会报 `pattern web/dist: no matching files found`。
2. **不要删除 `.docs/`**：这是本项目约定的工作文件目录。
3. `.env`、`one-api.db`、`logs/`、`web/dist`、`web/node_modules` 均已在 `.gitignore` 中，不会被提交。
4. 首次运行后端会在根目录生成 `one-api.db` 并执行自动迁移。

## 七、冒烟测试记录

```
端口：3001
GET /api/status -> HTTP 200
system_name  = Microsslink
docs_link    = (空)
数据库       = SQLite 自动建库，迁移成功，system_tasks 正常执行
```

## 八、本目录工作产物

- `.docs/run/micross-api.exe`：冒烟测试用的本地构建产物（可删除，重新 `go build` 即可）
- `.docs/run/stdout.log` / `stderr.log`：启动日志
- `.docs/env/setup.md`：本文件
