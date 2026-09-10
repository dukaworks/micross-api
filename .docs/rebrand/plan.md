# MicrossAPI 品牌改造计划（NewAPI → Microsslink | 微观互联）

## 项目信息

- **项目代号**：MicrossAPI
- **网站运营名**：Microsslink | 微观互联
- **来源 Logo**：`D:\xDev-Cache\Temp\microsslink.93847da649.png`（280×300，RGBA，透明背景）
- **改造范围**：本次先聚焦「前端可见的品牌标识与默认系统名称」替换，不动后端业务逻辑。

## 边界约定

- **必须保留**（AGENTS.md 受保护信息）：
  - `new-api` 项目标识（Go module path、README/License 署名、版权头、package metadata 等）
  - `QuantumNous` 组织署名
  - 页脚保留 "Powered by New API" 式开源归属（链接到 github.com/QuantumNous/new-api）
- **允许替换**（用户可见的运行时品牌）：
  - 网站标题、默认系统名称、Logo/Favicon
  - 前端 fallback 文案中的 "New API"
  - 前端默认文档链接（docs.newapi.pro）
  - About 页空状态中的项目仓库描述（改为 Microsslink 官方信息，同时保留上游感谢）

## 资产清单

| 目标文件 | 尺寸/格式 | 来源 | 用途 |
|---------|----------|------|------|
| `web/public/logo.png` | 180×180 PNG（RGBA） | 源 Logo 等比缩放 | 站点 Logo、动态 favicon |
| `web/public/favicon.ico` | 多尺寸 ICO（16×16, 32×32, 48×48） | 源 Logo 等比缩放 | 浏览器标签页图标 |
| `web/src/assets/logo.tsx` | React SVG 组件 | 引用 `/logo.png` | 旧 Logo 组件更新，避免残留 |

## 需要修改的文件

### 1. 静态资源
- `web/public/logo.png` → 替换为 Microsslink Logo
- `web/public/favicon.ico` → 替换为 Microsslink Favicon
- `web/src/assets/logo.tsx` → 更新 title/id，图标引用新 Logo

### 2. 前端入口与配置
- `web/index.html` → title/meta 改为 Microsslink
- `web/src/lib/constants.ts` → `DEFAULT_SYSTEM_NAME = 'Microsslink'`
- `web/src/features/system-settings/site/index.tsx` → 默认 `SystemName: 'Microsslink'`

### 3. 组件 fallback
- `web/src/components/layout/components/system-brand.tsx` → fallback 名称改为 'Microsslink'
- `web/src/components/layout/components/footer.tsx` → fallback displayName 改为 'Microsslink'；保留项目归属链接，文案微调为 "Powered by New API"
- `web/src/features/about/index.tsx` → 空状态文案改为 Microsslink 官网/联系信息，保留 One API 上游鸣谢
- `web/src/features/home/components/sections/hero.tsx` → 默认 docsUrl 改为空/占位；"NewAPI multi-protocol" 文案改为 "Microsslink"

### 4. 国际化
- `web/src/i18n/locales/en.json` → 替换面向用户的 "New API"/"NewAPI" 文案（保留技术术语如 channel type "New API"）
- `web/src/i18n/locales/zh.json` → 中文翻译 "Microsslink" / "微观互联"
- 其他 locale（zh-TW/fr/ru/ja/vi）同步替换（保留技术术语）

### 5. 后端默认值
- `common/constants.go` → `SystemName = "Microsslink"`
- `setting/operation_setting/general_setting.go` → `DocsLink` 默认改为空字符串或 Microsslink 文档占位

## 验证步骤

1. 检查 `web/public/logo.png` 与 `favicon.ico` 是否正确生成。
2. 用 `grep -R` 检查前端代码中是否还有未处理的 "New API" 用户可见文案。
3. 启动前端 dev server，查看首页、登录页、页脚、关于页、系统设置页的品牌显示。
4. 检查后端启动日志中的系统名是否为 Microsslink。
5. 确认页脚仍保留 New API 开源归属链接。

## 工作文件位置

- 本计划：`.docs/rebrand/plan.md`
- 生成脚本：`.docs/rebrand/scripts/generate_assets.py`
- 生成记录/中间产物：`.docs/rebrand/assets/`
