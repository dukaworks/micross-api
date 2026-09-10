# 变更记录

本项目变更记录。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循语义化版本，管理制度见 `governance/version-policy.md`。

## [未发布]

### 文档
- 建立工作文档中心 `.docs/`：新增文档索引（`README.md`）、版本管理制度（`governance/version-policy.md`）、本变更记录
- 新增任务 01「改造准备工作」文档目录

## [v0.1.0] - 2026-09-11

### 新增
- **品牌改造**：前端运行时品牌由 NewAPI 替换为 **Microsslink | 微观互联**
  - 前端：`web/index.html` 标题与 meta、`web/src/lib/constants.ts` 的 `DEFAULT_SYSTEM_NAME`、页脚、关于页、首页 hero、站点设置默认值、`web/src/assets/logo.tsx`
  - 后端：`common/constants.go` 的 `SystemName` 改为 `Microsslink`；`setting/operation_setting/general_setting.go` 的 `DocsLink` 默认值清空
  - i18n：`web/src/i18n/locales/` 下 en / zh / zh-TW / fr / ru / ja / vi 七个语言文件
- **品牌资产**：`web/public/logo.png`（180×180）、`web/public/favicon.ico`（16/32/48）

### 说明
- 基线来自上游 new-api 提交 `2d8e50bf`
- 保留全部上游保护信息（项目名、组织名、版权声明、Go module path）
- 详细改动清单见 `.docs/rebrand/summary.md`

### 环境
- 建立本地开发配置：根目录 `.env`（`DEBUG=true`、`MEMORY_CACHE_ENABLED=true`）、`web/.env`（`VITE_REACT_APP_SERVER_URL=http://localhost:3001`）
- 开发端口约定：后端 `3001`、前端 `5173`，详见 `.docs/env/setup.md`
