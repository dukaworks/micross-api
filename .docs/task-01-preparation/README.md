# 任务 01 — 改造准备工作

> 开始日期：2026-09-11
> 状态：进行中
> 类型：调研 + 文档（以"摸清地基"为目标，不含功能改造）

## 一、任务目标

在动手做功能改造之前，先把项目的"地基"彻底摸清并**记录成文档**：

- 环境可复现（任何人按文档能跑起来）
- 数据结构清楚（有哪些表、怎么迁移、怎么初始化）
- 前后端结构与运行逻辑清楚（请求怎么走、进程怎么起）
- 业务逻辑清楚（核心实体与链路）
- 全程有 Git 记录，任意时点可回滚

## 二、执行规则

| # | 规则 | 落实方式 |
|---|------|---------|
| 1 | 所有任务要有记录，形成文档 | 每个子任务产出一份 `.md`，统一放本目录 |
| 2 | 使用 Git 管理，可以回滚 | 开工前建立基线标签，收尾提交并打里程碑标签 |
| 3 | 形成版本管理制度 | `.docs/governance/version-policy.md` |
| 4 | 遵循项目现有基本规则 | 多语言（前端 i18next / 后端 go-i18n）、接口规范、编程规范，见 `.docs/README.md` 第六节与根目录 `AGENTS.md` |

## 三、任务清单与产出

| # | 任务 | 产出文档 | 状态 |
|---|------|---------|------|
| 1 | 运行环境准备 | [`01-environment.md`](./01-environment.md) | 已完成 |
| 2 | 数据结构：剖析 + 初始化 | [`02-database.md`](./02-database.md) | 已完成 |
| 3 | 后台项目：项目结构 + 运行逻辑 | [`03-backend-structure.md`](./03-backend-structure.md) | 已完成 |
| 4 | 后台项目：业务逻辑 | [`04-backend-business.md`](./04-backend-business.md) | 已完成 |
| 5 | 前台项目：项目结构 + 运行逻辑 | [`05-frontend-structure.md`](./05-frontend-structure.md) | 已完成 |
| 6 | 前台项目：业务逻辑 | [`06-frontend-business.md`](./06-frontend-business.md) | 已完成 |

### 各文档要点

| 文档 | 核心结论 |
|------|---------|
| `01-environment.md` | 工具链齐备；端口约定后端 3001 / 前端 5173；首次访问需走 Setup 向导 |
| `02-database.md` | 34 张表结构完整（无需修复）；业务数据为空（`users=0`、`setups=0`）⇒ 待初始化；`channels` 与 `abilities` 必须同步维护 |
| `03-backend-structure.md` | 根模块 + relaykit 独立子模块；启动 26 步时序；中继请求 9 步链路（预扣 → 选渠道 → 执行 → 结算） |
| `04-backend-business.md` | 计费链路为改造风险最高区域，附 6 条安全不变量与业务红线 |
| `05-frontend-structure.md` | React 19 + Rsbuild 2 + TanStack Router 文件式路由；axios 封装含 401 自动刷新与 GET 去重 |
| `06-frontend-business.md` | 3 个 zustand store + react-query；Bearer Token 鉴权（非 Cookie）；7 语言 i18n |

配套制度文档（不属于本任务产出，但为其提供支撑）：

- 文档索引与工作约定：`.docs/README.md`
- 版本管理制度：`.docs/governance/version-policy.md`
- 变更记录：`.docs/CHANGELOG.md`

## 四、验收标准

- [x] 按 `01-environment.md` 可从零启动前后端
- [x] `02-database.md` 覆盖全部数据表并说明初始化与迁移机制
- [x] `03`/`04` 覆盖后端目录职责、启动顺序、请求链路、核心业务实体与计费链路
- [x] `05`/`06` 覆盖前端目录职责、路由体系、请求层、状态管理、i18n
- [x] Git 有基线标签与里程碑标签，工作区干净

## 五、进度记录

| 日期 | 事项 |
|------|------|
| 2026-09-11 | 建立文档体系（`.docs/README.md`）、版本管理制度、变更记录；确认 Git 现状：分支仅 `main`、无标签、`VERSION` 为空、存在 13 个未提交的品牌改动文件 |
| 2026-09-11 | 启动前后端结构调研 |
| 2026-09-11 | 完成调研，产出 `01`~`06` 共 6 份文档（环境 / 数据结构 / 后端结构 / 后端业务 / 前端结构 / 前端业务） |
| 2026-09-11 | 品牌改造成果与任务01 文档提交入库，打 `v0.1.0` 里程碑标签 |

## 六、现状快照（2026-09-11）

```
仓库      https://github.com/dukaworks/micross-api
分支      main（与 origin/main 同步）
标签      无
未提交改动 13 个文件（品牌改造，见 .docs/rebrand/summary.md）
未跟踪    .docs/
VERSION   空文件
```
