# 03 — 后台项目：项目结构与运行逻辑

> 分析日期：2026-09-11
> 对象：`e:\xWorkshop\micross-api` 根模块（Go）
> 上游：`github.com/QuantumNous/new-api`（New API，基于 One API 演进）

## 一、模块构成

| 模块 | 路径 | 说明 |
|------|------|------|
| 根模块 | `github.com/QuantumNous/new-api` | 主服务：HTTP、业务、持久化 |
| 子模块 | `github.com/QuantumNous/new-api/relaykit` | 独立可构建的协议转换库 |

`go.mod` 通过 `require .../relaykit v0.0.0` + `replace => ./relaykit`（`go.mod:167-170`）引用子模块，因此根目录 `go build ./...` 会一并编译两者。

**relaykit 为什么独立**：它是一层**零业务耦合的纯协议库**，只包含跨厂商 DTO、错误类型、请求/响应注册表与转换器（`dto/`、`types/`、`relayconvert/`），刻意不依赖 Gin / GORM / 模型层。好处是：

- 可被独立测试与复用（`relayconvert/*_test.go` 有大量 golden 测试）
- 避免主模块与协议层循环引用
- 通过 `kitutil.SetLogging` / `SetSystemErrorLogging`（`main.go:50-53`）由主模块**反向注入**日志实现，实现依赖倒置

**强制约束**（`AGENTS.md`）：改动 `relaykit/` 或其公共 API 后，必须单独验证 `cd relaykit && GOWORK=off go build ./...`，根模块构建通过**不算数**。

## 二、目录结构与职责

| 目录 | 职责 | 关键文件 |
|------|------|---------|
| `router/` | 路由注册，按用途分层（api / relay / web / video / dashboard / authz） | `main.go SetRouter`、`api-router.go`、`relay-router.go` |
| `controller/` | HTTP 处理器：解析请求、编排 service | `relay.go`、`user.go`、`channel.go`、`token.go` |
| `service/` | 业务服务层：计费、渠道选择、额度、任务调度 | `billing.go`、`channel_select.go`、`quota.go`、`text_quota.go` |
| `model/` | 持久化 + 缓存：GORM 模型、DB 初始化、内存缓存 | `main.go`、`user.go`、`channel.go`、`ability.go`、`log.go` |
| `relay/` | 中继编排层：请求解析 → 渠道适配 → 响应 → 结算 | `relay.go`、`compatible_handler.go` |
| `relay/channel/` | 各上游厂商**适配器**（Adaptor 接口 + 每家实现） | `adapter.go`、`openai/`、`claude/`、`gemini/`、`task/` |
| `relay/common/` | 中继上下文与通用工具 | `relay_info.go`（`RelayInfo`） |
| `relaykit/` | 独立协议库 | `dto/`、`types/`、`relayconvert/` |
| `middleware/` | 中间件：鉴权、限流、渠道分发、日志、追踪 | `auth.go`、`distributor.go`、`rate-limit.go`、`i18n.go` |
| `setting/` | 运行时配置（按域分包） | `ratio_setting/`、`operation_setting/`、`billing_setting/` |
| `common/` | 基础设施工具（无业务逻辑） | `init.go`、`json.go`、`quota_math.go`、`redis.go` |
| `constant/` | 全局常量与 Context Key | `context_key.go`、`channel.go`、`setup.go` |
| `types/` | 宿主层类型 | `price_data.go`、`rw_map.go` |
| `i18n/` | 后端国际化 | `i18n.go`、`keys.go`、`locales/*.yaml` |
| `oauth/` | 第三方登录提供方 | `provider.go`、`registry.go`、`oidc.go` |
| `pkg/` | 独立子包 | `billingexpr/`（表达式计费）、`cachex/`、`perf_metrics/` |
| `dto/` | 宿主层请求 DTO | `task.go`、`midjourney.go`、`video.go` |
| `logger/` | 日志封装 | `logger.go SetupLogger` |
| `web/` | 前端工程（React，见 `05`/`06`） | — |

## 三、分层架构

```
HTTP 请求
   ↓
router/          路由匹配 + 中间件装配
   ↓
middleware/      鉴权 / 限流 / 渠道分发 / 语言 / 日志
   ↓
controller/      请求解析、响应封装
   ↓
service/         业务编排（计费、选渠道、额度）
   ↓
model/           数据持久化（GORM）+ 内存缓存
   ↓
relay/channel/   （中继场景）厂商协议适配
```

横向支撑：`common/`（工具）、`setting/`（配置）、`constant/`（常量）、`types/`（类型）。

## 四、启动流程（完整时序）

入口 `main.go:48 main()`，资源初始化集中在 `InitResources()`（`main.go:284`）。

| 序 | 动作 | 位置 |
|----|------|------|
| 1 | 注入 relaykit 的日志实现 | `main.go:50-53` |
| 2 | `InitResources()` → `godotenv.Load(".env")` | `main.go:287` |
| 3 | `common.InitEnv()`：flag 解析、密钥、端口、限流参数、`IsMasterNode`、`SyncFrequency` | `common/init.go:32` |
| 4 | `logger.SetupLogger()` | `main.go:297` |
| 5 | `ratio_setting.InitRatioSettings()` 模型/分组比率 | `main.go:300` |
| 6 | `service.InitHttpClient()`、`service.InitTokenEncoders()` | `main.go:302-304` |
| 7 | `model.InitDB()` 选库 + AutoMigrate（仅 master 迁移） | `main.go:307` |
| 8 | `authz.Init(model.DB)` Casbin 权限 | `main.go:312` |
| 9 | `model.CheckSetup()` → 写 `constant.Setup` | `main.go:317` |
| 10 | `MigrateRetiredFrontendOptions()` + `model.InitOptionMap()` | `main.go:320-325` |
| 11 | `common.CleanupOldCacheFiles()` | `main.go:328` |
| 12 | `model.InitLogDB()` 日志库（可独立 ClickHouse） | `main.go:331` |
| 13 | `common.InitRedisClient()`（无 Redis 自动降级） | `main.go:337` |
| 14 | `perfmetrics.Init()`、`common.StartSystemMonitor()` | `main.go:342-345` |
| 15 | `i18n.Init()` + `SetUserLangLoader` | `main.go:348-356` |
| 16 | `oauth.LoadCustomProviders()` | `main.go:359` |
| 17 | `service.StartAuthArtifactCleanup()` | `main.go:365` |
| — | ↓ 回到 `main()`，以下为 `InitResources` 之后 | — |
| 18 | 缓存启用时 `model.InitChannelCache()` + `go model.SyncChannelCache()` | `main.go:82-101` |
| 19 | `model.GetPricing()` 预热定价 | `main.go:106` |
| 20 | 后台协程：`SyncOptions`、`StartPolicySync`、`UpdateQuotaData` | `main.go:109-115` |
| 21 | 后台任务：Codex 凭证刷新、订阅额度重置、实例上报 | `main.go:126-133` |
| 22 | 注入 `GetTaskAdaptorFunc`，注册并启动系统任务 runner | `main.go:138-152` |
| 23 | 可选：批量更新、pprof、PyroScope | `main.go:154-171` |
| 24 | 构建 Gin 引擎、TrustedProxies、Recovery、全局中间件 | `main.go:174-193` |
| 25 | `router.SetRouter(server)` 注册路由树 | `router/main.go` |
| 26 | 启动 HTTP 监听（端口来自 `--port`，默认 3000） | — |

## 五、请求生命周期

### 5.1 业务 API：`GET /api/user/self`

| 步骤 | 位置 | 关键函数 |
|------|------|---------|
| 全局中间件 | `main.go:190-193` | RequestId → Version → I18n → Logger |
| 路由 | `router/api-router.go:82-89` | `SetApiRouter` / `selfRoute.GET("/self")` |
| 局部中间件 | `api-router.go:16-19,83` | RouteTag → Gzip → BodyStorageCleanup → GlobalAPIRateLimit → `middleware.UserAuth()` |
| 鉴权 | `middleware/auth.go` | `UserAuth()`：校验 session / access_token，写入 context `id`、`role` |
| 控制器 | `controller/user.go:481` | `GetSelf` |
| 权限计算 | `controller/user.go:493-495` | `calculateUserPermissions` + `authz.Capabilities` |
| 响应 | `controller/user.go:497` | `c.JSON(200, gin.H{success,message,data})` |

### 5.2 中继 API：`POST /v1/chat/completions`

| 步骤 | 位置 | 关键函数 |
|------|------|---------|
| 路由 | `router/relay-router.go:69,96` | `relayV1Router.POST("/chat/completions")` |
| 中间件链 | `relay-router.go:70-85` | RouteTag → `SystemPerformanceCheck` → `TokenAuth` → `ModelRequestRateLimit` → `Distribute` |
| 渠道分发 | `middleware/distributor.go:33` | `Distribute`：读取令牌与分组，先试亲和渠道，否则随机选择 |
| 控制器主流程 | `controller/relay.go:71` | `Relay` |
| 请求解析 | `relay.go:112` | `helper.GetAndValidateRequest` |
| 上下文组装 | `relay.go:123` | `relaycommon.GenRelayInfo` |
| 敏感词 / Token 估算 | `relay.go:139-154` | `service.CheckSensitiveText`、`EstimateRequestToken` |
| 价格计算 | `relay.go:156` | `helper.ModelPriceHelper`（`relay/helper/price.go:73`） |
| **预扣费** | `relay.go:167` | `service.PreConsumeBilling`（`service/billing.go:20`） |
| 选渠道 | `relay.go:196` | `service.CacheGetRandomSatisfiedChannel`（`service/channel_select.go:83`） |
| 执行 | `relay.go:36` | `relayHandler` → `relay.TextHelper`（`relay/compatible_handler.go:25`） |
| **结算** | `compatible_handler.go:90` | `service.PostTextConsumeQuota` → `SettleBilling` |
| 失败退款 | `relay.go:173-182` | `Billing.Refund` + `ChargeViolationFeeIfNeeded` |

**渠道选择细节**：

1. `Distribute` 读令牌分组 → 优先 `service.GetPreferredChannelByAffinity`
2. 否则 `service.CacheGetRandomSatisfiedChannel`
3. 实际选点 `model/channel_cache.go:114 GetRandomSatisfiedChannel`：**内存缓存**按 `group → model → channel` 的 `priority` / `weight` 做加权随机
4. 缓存未命中回退 `model/channel.go:108 GetChannel`，走 `abilities` 表

## 六、全局中间件与路由装配

- 全局（`main.go:190-193`）：RequestId、Version、I18n、Logger
- 路由树（`router/main.go SetRouter`）分层：`api`（业务）、`relay`（中继）、`web`（页面）、`video`、`dashboard`、`authz`
- 中继路由专属链：性能检查 → 令牌鉴权 → 模型级限流 → 渠道分发

## 七、运行时后台任务

| 任务 | 周期 / 触发 | 位置 |
|------|------------|------|
| 渠道缓存同步 | `SyncFrequency` | `main.go:101` |
| 配置热更新（options） | `SyncFrequency` | `main.go:109` |
| 授权策略同步 | `SyncFrequency` | `main.go:112` |
| 看板额度数据聚合 | 周期 | `main.go:115` |
| 渠道自动更新 | `CHANNEL_UPDATE_FREQUENCY` | `main.go:117-123` |
| Codex 凭证自动刷新 | 10 分钟 | `main.go:126` |
| 订阅额度重置 | 日/周/月/自定义 | `main.go:129` |
| 实例存活上报 | 周期 | `main.go:133` |
| 系统任务 runner（渠道测试、模型更新、异步任务轮询） | DB 租约去重 | `main.go:151-152` |
| 批量更新（可选） | `BATCH_UPDATE_ENABLED` | `main.go:154-158` |

## 八、关键文件速查表

| 路径 | 作用 |
|------|------|
| `main.go` | 启动入口、资源初始化、全局中间件、后台任务启动 |
| `router/api-router.go` | 业务 API 路由与中间件装配 |
| `router/relay-router.go` | 中继 API 路由与中间件链 |
| `middleware/auth.go` | `UserAuth` / `TokenAuth` / `AdminAuth` |
| `middleware/distributor.go` | 渠道分发与令牌分组处理 |
| `middleware/rate-limit.go`、`model-rate-limit.go` | 全局限流、模型级限流 |
| `controller/relay.go` | 中继主流程：预扣 → 选渠道 → 执行 → 结算/退款 |
| `relay/compatible_handler.go` | `TextHelper` 对话中继实现 |
| `relay/helper/price.go` | `ModelPriceHelper` 比率与单价计算 |
| `service/billing.go`、`billing_session.go` | 预扣 / 结算 / 退款会话 |
| `service/quota.go`、`text_quota.go` | 令牌预扣、用后计费 |
| `service/channel_select.go`、`channel_affinity.go` | 渠道选择与亲和 |
| `model/channel_cache.go` | 渠道内存缓存与加权随机 |
| `model/ability.go` | `abilities` 表同步维护 |
| `model/main.go` | DB 选型、AutoMigrate、`CheckSetup` |
| `common/quota_math.go` | 额度换算与饱和防护 |
| `common/json.go` | 统一 JSON 封装 |
| `i18n/i18n.go`、`middleware/i18n.go` | 后端国际化 |
