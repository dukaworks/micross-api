# 04 — 后台项目：业务逻辑

> 分析日期：2026-09-11
> 本篇聚焦"业务怎么跑"，结构与启动时序见 `03-backend-structure.md`

## 一、核心实体与关系

```
User ──1:N──> Token ──┐
  │                    │
  │                    ├──> Log（消费日志：记 user/token/channel/model/quota）
  ├──1:N──> UserSubscription ──> SubscriptionPlan
  │
  └──1:N──> Redemption（兑换码，used_user_id 回指）

Channel ──1:N──> Ability( group, model, channel_id )
                        ↑
                    中继选渠道的唯一索引来源
```

| 实体 | 表 | 业务角色 |
|------|-----|---------|
| User | `users` | 账号、额度（`quota` / `used_quota`）、分组、角色、邀请返利 |
| Token | `tokens` | API 访问凭证（`sk-xxx`），独立额度池，可限制模型/IP |
| Channel | `channels` | 上游供应商配置（类型、密钥、模型列表、权重、优先级） |
| Ability | `abilities` | 渠道能力的**反向索引**，中继按 `group+model` 查表选渠道 |
| Log | `logs` | 消费日志，计费结果落库的主要载体 |
| Redemption | `redemptions` | 兑换码充值 |
| SubscriptionPlan / UserSubscription | `subscription_plans` / `user_subscriptions` | 订阅制额度包（含周期重置、升降级分组） |
| Option | `options` | 全局配置键值对 |

## 二、用户体系与认证

| 能力 | 说明 |
|------|------|
| 登录方式 | 用户名密码、GitHub / Discord / OIDC / 微信 / Telegram / LinuxDO / 自定义 OAuth、Passkey（WebAuthn）、2FA（TOTP + 备用码） |
| 会话 | `user_sessions` 表，`sid` 为主键；带 refresh 哈希轮换链（`refresh_hash` / `previous_refresh_hash` / `previous_valid_until`） |
| 会话失效 | `users.auth_version` 变化即批量失效旧会话 |
| 权限 | 两层：`authz_roles`（角色定义）+ `casbin_rule`（策略），由 `authz.Init` 初始化、`authz.StartPolicySync` 周期同步 |
| 前端契约 | 请求头 `Authorization: Bearer <access_token>` |

**关键点**：`AccessToken` 在 `users` 表中，前端登录后拿到的是 access token（内存保存），刷新走 `user_sessions` 的 refresh 机制。

## 三、渠道管理与模型能力（ability）

这是本项目**最容易踩坑**的地方：`channels` 表与 `abilities` 表必须保持一致。

| 场景 | 触发函数 | 位置 |
|------|---------|------|
| 新增渠道 | `Channel.AddAbilities`（先删后插，分批 50） | `model/ability.go:196` |
| 批量新增 | `BatchInsertChannels` | `model/channel.go:436` |
| 更新渠道 | `Channel.UpdateAbilities` | `model/ability.go:243` |
| 删除渠道 | `Channel.DeleteAbilities` / `BatchDeleteChannels` | `model/ability.go:237` / `channel.go:465` |
| 改状态 | `UpdateAbilityStatus` | `model/ability.go:313` |
| 全量修复 | `FixAbility` + `InitChannelCache` | `model/ability.go:337` |

**运行时读取路径**：中继请求 → `model/channel_cache.go` 内存缓存（`group → model → [channels]`，按 `priority`/`weight` 加权随机）→ 未命中回退 `abilities` 表。

**结论**：新增渠道或修改渠道的 `models` / `group` 字段后，必须确认 ability 已重建（正常走 Admin API 无需手工干预；直接改库则必须重建缓存）。

## 四、令牌与鉴权

| 环节 | 说明 |
|------|------|
| 鉴权入口 | `middleware/auth.go` `TokenAuth()`（`auth.go:352`） |
| 令牌字段 | `key`、`remain_quota`、`unlimited_quota`、`model_limits_enabled` + `model_limits`、`allow_ips`、`group`、`cross_group_retry`、`auto_groups` |
| 校验顺序 | 令牌有效性 → 过期时间 → 额度 → 模型白名单 → IP 白名单 → 分组可用性 |
| 限流 | 全局限流 `GlobalAPIRateLimit`；模型级 `ModelRequestRateLimit`（`middleware/model-rate-limit.go:168`） |

## 五、计费链路（核心）

### 5.1 全流程

```
ModelPriceHelper（比率/单价）
      ↓
PreConsumeBilling（预扣费）
      ↓
渠道执行（流式/非流式）
      ↓
PostTextConsumeQuota → SettleBilling（结算：多退少补）
      ↓
失败则 Billing.Refund（退款，幂等 + 异步）
```

### 5.2 各阶段分工

| 阶段 | 文件 : 函数 | 职责 |
|------|------------|------|
| 比率计算 | `relay/helper/price.go:73` `ModelPriceHelper` | 读模型/分组比率，算出 `QuotaToPreConsume` |
| 分层表达式 | `service/tiered_settle.go` | `tiered_expr` 表达式计费分支（设计文档 `pkg/billingexpr/expr.md`） |
| 数值工具 | `common/quota_math.go` | `QuotaFromFloat` / `QuotaRound` / `QuotaFromDecimal`，含 int32 饱和、NaN 防护、`QuotaClamp` 审计标记 |
| 预扣费 | `service/billing.go:20` `PreConsumeBilling` → `billing_session.go:357` `NewBillingSession` | 按钱包/订阅偏好建立计费会话 |
| 原子预扣 | `model/quota_reserve.go` `TryReserveUserQuota` / `TryReserveTokenQuota` | Redis Lua 原子扣减；无 Redis 降级为 DB 条件更新 |
| 会话预扣 | `billing_session.go:187` `preConsume` | 信任额度旁路 → 扣令牌 → 扣资金来源，失败回滚 |
| 结算 | `service/billing.go:51` `SettleBilling` → `billing_session.go:42` `Settle` | `delta = 实际 - 预扣`，补扣或退还（资金 + 令牌） |
| 旧路径 | `service/quota.go:414` `PostConsumeQuota` | 无会话时的回退实现 |
| 退款 | `billing_session.go:83` `Refund` | 幂等，异步执行（gopool） |

### 5.3 安全不变量（来自 `AGENTS.md`，改造时必须遵守）

1. **绝不允许产生负数扣费（即变相返利）**：所有用户可控的乘数（图片 `n`、视频 `seconds`、分辨率比例、批量数）都必须在请求校验阶段设上界并拒绝越界。
2. **禁止裸类型转换**：不得出现 `int(float64(quota) * ratio)` 这类写法，必须走 `common.QuotaFromFloat` / `QuotaRound` / `QuotaFromDecimal`。
3. **饱和可审计**：使用 `*Checked` 变体拿到 `QuotaClamp`，挂到 `relayInfo.QuotaClamp`，由 `service/log_info_generate.go` 的 `attachQuotaSaturation` 写入日志 `other.admin_info.quota_saturation`（仅管理员可见）并打印告警日志。
4. **预扣与结算都要安全**：饱和的超大额度必须在预扣阶段就以"额度不足"失败，不允许静默回绕。
5. **乘数地图**：只能通过 `types.PriceData.AddOtherRatio` 写入（内部拒绝非正数、NaN、+Inf）。
6. **无符号类型必须有上界**：`*uint` 字段能接收被回绕的大正数，仅 `>= 0` 校验不够。

### 5.4 额度存储

`user.quota`、`token.remain_quota`、`logs.quota` 均为 **32 位整数**，这是饱和边界取 int32 的原因。

## 六、日志体系

| 类型 | 表 | 说明 |
|------|-----|------|
| 消费日志 | `logs` | 每次中继调用的记录（用户、令牌、渠道、模型、额度、tokens、耗时、是否流式、`other` JSON） |
| 任务日志 | `tasks` / `midjourneys` | 异步媒体任务的状态与结果 |
| 系统日志 | `system_tasks` | 定时任务运行历史 |

- 日志库可独立（`LOG_SQL_DSN`，支持 ClickHouse），查询时不能假定与主库同连接
- `logs.other` 中的 `admin_info` 字段在非管理员视图中会被剥离，是存放审计信息的标准位置

## 七、订阅与兑换

| 能力 | 说明 |
|------|------|
| 兑换码 | `redemptions`：管理员生成 → 用户兑换 → 增加 `quota` |
| 订阅计划 | `subscription_plans`：支持余额支付 / 钱包溢出 / 多支付渠道（Stripe、Creem 等） |
| 用户订阅 | `user_subscriptions`：额度池 `amount_total` / `amount_used`，支持周期重置（`quota_reset_period`），支持升级/降级分组 |
| 预扣记录 | `subscription_pre_consume_records`：订阅扣费用的请求级记录 |

## 八、异步任务系统

- `tasks` 表承载 Midjourney / Suno / 视频等平台的异步任务（`platform` + `action` + `status` + `properties`）
- 轮询通过系统任务 runner 驱动：`service.RunTaskPollingOnce`，适配器由 `relay.GetTaskAdaptor` 提供（`main.go:138-144` 注入以打破 `service → relay` 循环引用）
- 任务同样有预扣费与结算（超时或失败按规则退款）

## 九、改造时的业务红线

1. 改渠道逻辑 → 同步维护 `abilities`，并确认渠道缓存刷新。
2. 改计费逻辑 → 必须阅读 `pkg/billingexpr/expr.md`，并遵守第 5.3 节全部不变量。
3. 新增用户可见 API 错误信息 → 走后端 i18n（`i18n/`），不要硬编码中文字符串。
4. 新增 JSON 结构 → 用 `common.Marshal` / `common.Unmarshal`，不要直接 `encoding/json`。
5. 新增配置开关 → 优先落到 `options` 表（可后台配置），避免硬编码。
6. 新增请求字段 → 可选标量必须用指针 + `omitempty`，以保证"客户端未传"与"显式传 0"可区分。
