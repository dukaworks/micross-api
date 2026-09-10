# MicrossAPI 工作文档中心

> 最后更新：2026-09-11
> 工作区：`e:\xWorkshop\micross-api`

## 一、定位

`.docs/` 是本项目二次改造的**工作文档中心**，集中存放任务计划、调研结论、设计说明、变更记录与临时产物。

核心约定：**任何任务都必须在本目录留下可追溯的文档**，做到"任务有记录、改动可回滚、版本可管理"。

## 二、目录结构

| 目录 / 文件 | 用途 |
|-------------|------|
| `README.md` | 本文件，文档总索引与工作约定 |
| `governance/` | 项目治理制度（版本管理、分支策略、提交规范、回滚流程） |
| `CHANGELOG.md` | 变更记录（按版本 / 任务归档） |
| `task-XX-<name>/` | 按任务编号归档的任务文档 |
| `env/` | 运行环境（工具链、依赖、端口约定） |
| `rebrand/` | 品牌改造（已完成的第一阶段） |
| `run/` | 临时产物：构建产物、日志、一次性脚本（可随时清理） |

## 三、任务文档规范

每个任务在 `.docs/task-XX-<name>/` 下建独立目录，建议结构：

```
task-XX-<name>/
├── README.md      # 任务总览：目标、范围、任务清单、进度
├── plan.md        # 实施方案（简单任务可并入 README）
├── summary.md     # 完成总结（任务收尾时必写）
└── NN-<topic>.md  # 分主题产出文档
```

命名规则：目录与文件名用英文小写短横线，正文用中文（与现有 `env/`、`rebrand/` 保持一致）。

## 四、标准工作流

1. **计划** — 在任务 `README.md` 写清目标、范围、任务清单与验收标准
2. **基线** — 动手前确认 Git 状态，必要时打基线标签（见 `governance/version-policy.md`）
3. **执行** — 按主题分文件产出文档，边做边记，避免事后补写
4. **验证** — 记录**可复现**的验证命令与结果（不能只写"已验证"）
5. **收尾** — 写 `summary.md` → 提交 → 打里程碑标签

## 五、任务索引

| 编号 | 任务 | 状态 | 文档 |
|------|------|------|------|
| 01 | 改造准备工作 | 进行中 | [task-01-preparation](./task-01-preparation/README.md) |
| — | 品牌改造（前置已完成） | 已完成 | [rebrand/summary.md](./rebrand/summary.md) |
| — | 运行环境准备（前置已完成） | 已完成 | [env/setup.md](./env/setup.md) |

## 六、红线约束

以下约束来自 `AGENTS.md` 与本项目既有约定，任何改动不得突破：

- **保护信息不可动**：上游项目名、组织名（`QuantumNous`）、版权声明、`LICENSE`、README 署名、Go module path（`github.com/QuantumNous/new-api`）均不得修改或删除。
- **多语言**：新增用户可见文案必须支持 i18n。
  - 前端：`web/src/i18n/locales/{lang}.json`，键为英文原文，用 `t('English key')`
  - 后端：`i18n/`（go-i18n，en / zh）
- **relaykit 独立可构建**：改动 `relaykit/` 或影响其公共 API 时，必须验证 `cd relaykit && GOWORK=off go build ./...`
- **JSON 统一封装**：业务代码序列化一律走 `common.Marshal` / `common.Unmarshal`，不直接调用 `encoding/json`
- **数据库三兼容**：SQLite / MySQL >= 5.7.8 / PostgreSQL >= 9.6 必须同时可用
- **计费安全不变量**：额度运算不得因溢出或未校验输入产生负数，统一走 `common/quota_math.go` 的转换辅助函数
