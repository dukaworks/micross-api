# 02 — 数据结构剖析与初始化

> 分析日期：2026-09-11
> 数据来源：实际读取 `one-api.db` + 源码 `model/main.go`
> 结论：库结构完整（34 张表），业务数据为空，系统处于**待初始化**状态

## 一、数据库选型与连接机制

| 项 | 说明 | 位置 |
|----|------|------|
| 默认数据库 | SQLite，文件为项目根目录 `one-api.db` | 未配置 `SQL_DSN` 时自动选择 |
| 支持类型 | SQLite / MySQL / PostgreSQL / ClickHouse | `model/main.go` `chooseDB` |
| 主库与日志库分离 | `SQL_DSN`（主库）、`LOG_SQL_DSN`（日志库，可独立为 ClickHouse） | `model.InitDB` / `model.InitLogDB` |
| 迁移执行者 | **仅 master 节点**执行 AutoMigrate | `main.go:307`（`common.IsMasterNode`） |
| 方言适配 | PostgreSQL 用 `"col"`，MySQL/SQLite 用 `` `col` ``；保留字列用 `commonGroupCol` / `commonKeyCol` | `model/main.go:30` `initCol` |

## 二、表清单（共 34 张，按业务域归类）

### 1. 用户与认证域（11 张）

| 表 | 行数 | 主键 | 说明 |
|----|------|------|------|
| `users` | 0 | id | 用户主表（30 字段，含 quota / used_quota / group / role / aff_* / 多渠道绑定 id） |
| `user_sessions` | 0 | sid | 登录会话，含 refresh 令牌哈希与轮换链 |
| `two_fas` | 0 | id | 双因素认证（TOTP secret） |
| `two_fa_backup_codes` | 0 | id | 2FA 备用码 |
| `passkey_credentials` | 0 | id | WebAuthn / Passkey 凭证 |
| `auth_flows` | 0 | id | 认证流程临时态（OAuth / 2FA 等），含 token_hash、purpose、expires_at |
| `user_oauth_bindings` | 0 | id | 用户与自定义 OAuth 提供方的绑定 |
| `external_identity_claims` | 0 | id | 外部身份声明（provider + subject） |
| `custom_oauth_providers` | 0 | id | 管理员配置的自定义 OAuth 提供方（21 字段） |
| `authz_roles` | **2** | id | 授权角色（Casbin 之上的一层角色定义） |
| `casbin_rule` | **3** | id | Casbin 权限策略规则 |

### 2. 渠道与模型域（5 张）

| 表 | 行数 | 主键 | 说明 |
|----|------|------|------|
| `channels` | 0 | id | 上游渠道（30 字段，含 type / key / models / group / priority / weight / status / 各类 override） |
| `abilities` | 0 | **group, model, channel_id**（复合） | 渠道能力索引表，中继选渠道的核心依据 |
| `models` | 0 | id | 模型元数据（图标、标签、端点、厂商） |
| `vendors` | 0 | id | 模型厂商 |
| `prefill_groups` | 0 | id | 预填分组（渠道批量配置模板） |

### 3. 令牌与计费域（10 张）

| 表 | 行数 | 主键 | 说明 |
|----|------|------|------|
| `tokens` | 0 | id | API 令牌（18 字段，含 remain_quota / unlimited_quota / model_limits / allow_ips / auto_groups） |
| `redemptions` | 0 | id | 兑换码 |
| `logs` | 0 | id | **消费日志**（21 字段，含 quota / tokens / 耗时 / channel / token / request_id / other） |
| `quota_data` | 0 | id | 额度统计聚合（看板用） |
| `top_ups` | 0 | id | 充值订单 |
| `subscription_plans` | 0 | id | 订阅计划（23 字段） |
| `subscription_orders` | 0 | id | 订阅订单 |
| `user_subscriptions` | 0 | id | 用户订阅实例（额度池、重置周期、升降级组） |
| `subscription_pre_consume_records` | 0 | id | 订阅预扣记录 |
| `checkins` | 0 | id | 每日签到奖励 |

### 4. 任务与媒体域（2 张）

| 表 | 行数 | 主键 | 说明 |
|----|------|------|------|
| `tasks` | 0 | id | 通用异步任务（Midjourney / Suno / 视频等，含 platform / action / status / properties） |
| `midjourneys` | 0 | id | Midjourney 专用任务表（24 字段） |

### 5. 系统与运维域（6 张）

| 表 | 行数 | 主键 | 说明 |
|----|------|------|------|
| `options` | **1** | key | 全局配置键值对（当前仅 `theme.frontend`，其余走代码默认值） |
| `setups` | **0** | id | 系统初始化记录（**空 = 未初始化**） |
| `system_tasks` | **1** | id | 系统定时任务实例（含 active_key 去重、state、result） |
| `system_task_locks` | 0 | type | 任务分布式锁（DB 租约，多 master 去重） |
| `system_instances` | **1** | node_name | 存活实例登记（多实例部署可见） |
| `perf_metrics` | 0 | id | 性能指标分桶（模型/分组/延迟/TTFT） |

## 三、核心表结构要点

### `users`（30 字段）

关键字段：`username` / `password`（哈希）/ `role`（root/admin/common）/ `status` / `quota`（剩余额度）/ `used_quota` / `request_count` / `group` / `email` / `setting`（JSON）/ `auth_version`（会话失效版本）/ `aff_*`（邀请返利）/ 各第三方平台 id。

### `channels`（30 字段）

关键字段：`type`（渠道类型常量）/ `key` / `base_url` / `models`（逗号分隔模型列表）/ `group` / `priority` / `weight`（负载权重）/ `status`（启用/禁用/自动封禁）/ `auto_ban` / `model_mapping` / `status_code_mapping` / `param_override` / `header_override` / `setting` / `balance`（余额查询结果）。

### `abilities`（复合主键）

`(group, model, channel_id)` 三元组唯一，附 `enabled` / `priority` / `weight` / `tag`。

**这是选渠道的性能关键表**：中继请求按 `group + model` 查可用渠道，再按 `priority` / `weight` 随机挑选。渠道增删改时**必须重建**该表对应记录，否则出现「渠道配了但请求 404 无可用渠道」。

### `logs`（21 字段）

`user_id` / `token_id` / `channel_id` / `model_name` / `quota` / `prompt_tokens` / `completion_tokens` / `use_time` / `is_stream` / `content`（错误或详情）/ `request_id` / `upstream_request_id` / `other`（JSON，含 `admin_info`，仅管理员可见）。

### `tokens`（18 字段）

`key`（明文存储的令牌）/ `remain_quota` / `unlimited_quota` / `model_limits_enabled` + `model_limits`（模型白名单）/ `allow_ips`（IP 白名单）/ `group` / `cross_group_retry` / `auto_groups`。

## 四、初始化与迁移机制

| 阶段 | 动作 | 位置 |
|------|------|------|
| 1 | 读取 `.env`、加载环境变量 | `main.go:287,295` |
| 2 | `model.InitDB()`：选库 → 建立连接 → 设置连接池 | `model/main.go` `InitDB` |
| 3 | **AutoMigrate**：按代码内模型清单建表 / 补列（仅 master） | `model/main.go:171` 附近 |
| 4 | `authz.Init(model.DB)`：写入内置角色与 Casbin 策略 | `main.go:312` |
| 5 | `model.CheckSetup()`：判定初始化状态 | `main.go:317` |
| 6 | `model.InitOptionMap()`：把 `options` 表加载进内存 map，缺失项用代码默认值 | `main.go:325` |
| 7 | `model.InitLogDB()`：日志库（可与主库分离） | `main.go:331` |
| 8 | `common.InitRedisClient()`：Redis 不可用时自动降级 | `main.go:337` |

**迁移注意事项**（来自 `AGENTS.md`）：

- 三库兼容，SQLite 不支持 `ALTER COLUMN`，只能 `ALTER TABLE ... ADD COLUMN`。
- 避免使用 `gorm:"default:true"`，因为 MySQL/PG 归一化差异会导致每次启动重复 `ALTER TABLE`。
- 不直接使用 `AUTO_INCREMENT` / `SERIAL`，主键交给 GORM 生成。

## 五、首次初始化流程（业务层）

**关键结论：本版本不再自动创建管理员账号。**

```57:78:model/main.go
func createRootAccountIfNeed() error {
	var user User
	//if user.Status != common.UserStatusEnabled {
	if err := DB.First(&user).Error; err != nil {
		common.SysLog("no user exists, create a root user for you: username is root, password is 123456")
```

该函数在当前代码中**只有定义、全仓库无任何调用点**（已废弃）。实际流程改由 Setup 向导接管：

| 环节 | 行为 |
|------|------|
| `CheckSetup()` | `setups` 表无记录且无 root 用户 → `constant.Setup = false` |
| 前端 | `__root.tsx` 检测到未初始化即重定向到 `/setup` |
| 向导提交 | `POST /api/setup`：校验（用户名 ≤12、密码 ≥8）→ 创建 root 用户 → 写入 `SelfUseModeEnabled` / `DemoSiteEnabled` → 插入 `setups` 记录 → `constant.Setup = true` |

## 六、当前数据库实际状态（2026-09-11 实测）

```
TABLE_COUNT = 34

非空表：
  options            1 行   （仅 theme.frontend = default）
  authz_roles        2 行   （authz 初始化写入的内置角色）
  casbin_rule        3 行   （authz 初始化写入的策略）
  system_instances   1 行   （当前进程注册）
  system_tasks       1 行   （已注册的系统任务）

空表（业务数据全部为零）：
  users / channels / tokens / logs / abilities / redemptions /
  subscription_* / tasks / midjourneys / quota_data / top_ups / ...
```

**解读**：

- 表结构与迁移 **完全正常**，无需修复。
- 业务层**未初始化**：`users = 0`、`setups = 0` ⇒ `constant.Setup = false`，`GET /api/setup` 返回 `{"status":false,"root_init":false,"database_type":"sqlite"}`。
- 这是**设计预期行为**，不是故障。完成 Setup 向导即可转为可用状态。

## 七、改造注意点

1. **改动 `channels` 相关逻辑时必须同步维护 `abilities`**（否则渠道不可用）。
2. **额度字段是 32 位整数**（user / token / logs 的 quota 列），所有额度换算必须走 `common/quota_math.go`，避免溢出变负。
3. 新增配置优先放入 `options` 表（GORM `Option` 模型），而不是硬编码，便于后台可配。
4. 新增表/字段必须同时兼容 SQLite / MySQL / PostgreSQL 三种 AutoMigrate 行为。
5. 日志表可能落在独立日志库（`LOG_SQL_DSN`），涉及日志的查询不要假定与主库同连接。
