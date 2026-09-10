# MicrossAPI 品牌替换完成总结

## 改造目标
将 NewAPI 前端运行时品牌替换为 **Microsslink | 微观互联**，同时保留项目上游归属与受保护的项目标识。

## 本次完成内容

### 1. 品牌资产生成
- **源文件**：`D:\xDev-Cache\Temp\microsslink.93847da649.png`（280×300，透明背景）
- **输出到项目**：
  - `web/public/logo.png`：180×180 PNG，与旧 Logo 尺寸一致
  - `web/public/favicon.ico`：多尺寸 ICO（16×16、32×32、48×48）
- **生成脚本**：`.docs/rebrand/scripts/generate_assets.py`
- **备份/中间产物**：`.docs/rebrand/assets/logo.png`、`.docs/rebrand/assets/favicon.ico`

### 2. 前端品牌替换

| 文件 | 改动说明 |
|------|---------|
| `web/index.html` | 标题与 meta 改为 `Microsslink \| 微观互联` |
| `web/src/lib/constants.ts` | `DEFAULT_SYSTEM_NAME` 改为 `Microsslink` |
| `web/src/features/system-settings/site/index.tsx` | 系统名称默认值改为 `Microsslink` |
| `web/src/components/layout/components/system-brand.tsx` | 品牌名 fallback 改为 `Microsslink` |
| `web/src/components/layout/components/footer.tsx` | 页脚主版权显示 `Microsslink`；项目归属改为 `Powered by New API` 并保留 GitHub 链接 |
| `web/src/features/about/index.tsx` | 空状态文案改为 Microsslink 风格，保留 New API / One API 上游鸣谢 |
| `web/src/features/home/components/sections/hero.tsx` | 文档链接默认置空；首页文案 `NewAPI` 改为 `Microsslink` |
| `web/src/assets/logo.tsx` | SVG 组件 title/id 改为 `microsslink-logo` / `Microsslink` |

### 3. 国际化
- 更新 `web/src/i18n/locales/` 下全部 7 个语言文件：en、zh、zh-TW、fr、ru、ja、vi
- 将面向用户的 `New API` / `NewAPI` 文案替换为 `Microsslink`
- 新增 `Powered by` 键，支持页脚归属文案多语言
- **保留未改**：技术术语（如 New API 渠道类型）、测试文件、版权声明
- **批量脚本**：`.docs/rebrand/scripts/update_locales.py`

### 4. 后端默认值
- `common/constants.go`：`SystemName` 默认值由 `New API` 改为 `Microsslink`
- `setting/operation_setting/general_setting.go`：`DocsLink` 默认值清空，避免默认跳转 docs.newapi.pro

## 未改动（受保护或暂不处理）

- **版权头/项目归属**：保留 `QuantumNous` / `new-api` 版权声明、LICENSE、README 署名
- **Go module path**：`github.com/QuantumNous/new-api` 保持不变
- **技术标识**：`ChannelTypeNewAPI`、`NewAPIError`、`constant.ChannelTypeNewAPI` 等保持不变
- **前端 demo 模式页脚链接**：`footer.tsx` 中 `fallbackColumns` 的 docs.newapi.pro 链接仅在启用 demo 站点时显示，本次未替换（可在系统设置中配置自定义 footer HTML 覆盖）
- **后端测试**：`common/email_test.go` 等测试中显式设置 `SystemName = "New API"`，不影响运行

## 验证情况

- `go build ./common ./setting/operation_setting` 通过
- 前端 `node_modules` 未安装，暂未运行类型检查；改动均为字符串替换与简单组件 props 调整，风险较低
- 已确认 `web/public/logo.png`（180×180）与 `favicon.ico`（16/32/48）生成正确

## 待后续处理（可选）

1. 安装前端依赖后运行 `bun run typecheck` 与 `bun run build` 做完整编译验证
2. 在系统设置中配置 Microsslink 的官方网站、联系链接、自定义 footer 等
3. 如需替换 demo 模式页脚链接，可后续提供目标 URL 后统一替换
4. 运行后端单元测试 `go test ./common/...` 确认无回归

## 工作文件索引

- 计划：`.docs/rebrand/plan.md`
- 总结：`.docs/rebrand/summary.md`
- Logo/Favicon 生成脚本：`.docs/rebrand/scripts/generate_assets.py`
- 多语言批量更新脚本：`.docs/rebrand/scripts/update_locales.py`
- 资产备份：`.docs/rebrand/assets/logo.png`、`.docs/rebrand/assets/favicon.ico`
