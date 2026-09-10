# MicrossAPI 版本管理制度

> 生效日期：2026-09-11
> 适用范围：`e:\xWorkshop\micross-api` 全部代码与文档改动

## 一、总则

1. 本项目是上游 [new-api](https://github.com/QuantumNous/new-api) 的二次开发分支（fork），仓库为 `dukaworks/micross-api`。
2. 一切改动纳入 Git 管理，保证**任意时点可回滚**。
3. 每个任务有独立文档目录（见 `.docs/README.md`）。
4. 上游保护信息不得改动（见 `AGENTS.md` 项目治理章节）。

## 二、版本号规范

采用语义化版本：`vMAJOR.MINOR.PATCH`

| 位 | 含义 | 本项目用法 |
|----|------|-----------|
| MAJOR | 不兼容的重大变更 | 仅在数据结构或接口契约发生破坏性变更时递增 |
| MINOR | 向后兼容的功能新增 | 每完成一个改造任务递增 |
| PATCH | 向后兼容的问题修复 | 缺陷修复、文案微调 |

**版本起点**：`v0.1.0`（基于上游提交 `2d8e50bf`，已完成品牌改造）

### 版本落地点（当前存在缺口）

| 位置 | 现状 | 目标 |
|------|------|------|
| `VERSION`（根目录） | **空文件** | 写入当前版本号，如 `v0.1.0` |
| `common/constants.go:14` | `var Version = "v0.0.0"` 硬编码占位 | 构建时以环境变量 `VERSION` 覆盖（`common/init.go:35` 已支持） |
| 前端构建 | `makefile:18` 读取 `VERSION` 注入 `VITE_REACT_APP_VERSION` | 依赖 `VERSION` 文件非空 |
| Git 标签 | **无任何标签** | 每个里程碑打 `vX.Y.Z` |

> 约定：`VERSION` 文件内容**带 `v` 前缀**，例如 `v0.1.0`。

## 三、分支策略

| 分支 | 用途 | 说明 |
|------|------|------|
| `main` | 稳定基线 | 始终可运行；每个任务完成后归入此分支 |
| `task/<编号>-<简述>` | 任务开发 | 例：`task/01-preparation` |
| `fix/<简述>` | 缺陷修复 | 例：`fix/channel-test-timeout` |
| `upstream-sync` | 上游同步 | 专门用于合并上游 new-api 的新提交 |

当前仓库仅有 `main`。单人开发阶段可直接在 `main` 上小步提交，但**每个任务收尾必须打标签**；涉及大范围改动时，先在 `task/*` 分支开发，验证通过后合并。

## 四、提交规范

采用 Conventional Commits，与上游 `git log` 风格保持一致：

```
<type>(<scope>): <subject>
```

**type**：`feat` `fix` `docs` `refactor` `test` `chore` `style` `perf`

**scope**：`web`（前端）、`relay`（代理）、`model`、`service`、`controller`、`setting`、`docs`、`deps`

示例：

```
feat(web): add microsslink brand to hero section
docs(task-01): add database structure analysis
fix(relay): preserve parameterless tools in claude conversion
```

要求：

- 一个提交只做一件事，避免混合无关改动
- 提交信息说明"为什么"，而非仅描述"做了什么"
- 提交前必须通过第六节的校验

## 五、标签与里程碑

| 标签 | 含义 |
|------|------|
| `baseline-<任务号>` | 任务开工前的基线快照，便于回滚到"动手前" |
| `vX.Y.Z` | 版本里程碑 |

```powershell
# 打标签（annotated）
git tag -a v0.1.0 -m "品牌改造完成：NewAPI -> Microsslink"
git push origin v0.1.0
```

## 六、提交前校验（Definition of Done）

```powershell
# 1. 后端编译（需先存在 web/dist）
cd e:\xWorkshop\micross-api
go build ./...

# 2. relaykit 独立构建（涉及 relaykit 时必须执行）
cd relaykit
$env:GOWORK="off"; go build ./...

# 3. 前端类型检查与构建
cd ..\web
bun run typecheck
bun run build
```

按改动范围选择执行。涉及计费、数据结构、鉴权的改动，必须补跑相关 `go test`。

## 七、回滚流程

| 场景 | 命令 | 说明 |
|------|------|------|
| 撤销已推送的提交 | `git revert <commit>` | **推荐**，保留历史，生成反向提交 |
| 丢弃单文件未提交改动 | `git restore <file>` | 不可恢复 |
| 回到某个标签（未推送） | `git reset --hard <tag>` | 会丢弃后续提交，慎用 |
| 回滚前查看范围 | `git diff <tag>..HEAD --stat` | 先看清影响面 |

**回滚前置动作**：先执行 `git status` 确认工作区状态，避免覆盖未提交成果。

## 八、与上游同步

- 当前远程：`origin` = `https://github.com/dukaworks/micross-api`
- 如需跟上游 `QuantumNous/new-api` 同步：

```powershell
git remote add upstream https://github.com/QuantumNous/new-api.git
git fetch upstream
git merge upstream/main
```

- 合并前务必确认品牌改造点（见 `.docs/rebrand/summary.md`）未被上游覆盖。

## 九、变更记录

所有版本与任务变更记入 `.docs/CHANGELOG.md`。
