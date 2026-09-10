import json
import sys
from pathlib import Path

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

LOCALES_DIR = Path(r'E:\xWorkshop\micross-api\web\src\i18n\locales')

# 需要替换品牌名的键（值中的 New API / NewAPI 替换为 Microsslink）
BRAND_KEYS = [
    "New API",
    "NewAPI",
    "New API &lt;noreply@example.com&gt;",
    "New API Project Repository:",
    "https://github.com/QuantumNous/new-api",
    "e.g. New API Console",
    "Custom API base URL. For official channels, New API has built-in addresses. Only fill this for third-party proxy sites or special endpoints. Do not add /v1 or trailing slash.",
    "Welcome to our New API...",
    "Supports one-click configuration and perfectly adapts to NewAPI multi-protocol configuration.",
    "Warning: Base URL should not end with /v1. New API will handle it automatically. This may cause request failures.",
]

POWERED_BY_TRANSLATIONS = {
    'en': 'Powered by',
    'zh': '由 ... 驱动',
    'zh-TW': '由 ... 驅動',
    'fr': 'Propulsé par',
    'ru': 'Работает на',
    'ja': 'Powered by',
    'vi': 'Được cung cấp bởi',
}

def update_locale(path: Path, locale: str) -> dict:
    with path.open('r', encoding='utf-8') as f:
        data = json.load(f)

    # NewAPI i18n 文件结构为 {"translation": {...}}
    if 'translation' not in data or not isinstance(data['translation'], dict):
        print(f'  [{locale}] 未找到 translation 对象，跳过')
        return data

    translations = data['translation']
    changed = 0
    for key in BRAND_KEYS:
        if key in translations:
            old = translations[key]
            new = old.replace('NewAPI', 'Microsslink').replace('New API', 'Microsslink')
            if new != old:
                translations[key] = new
                changed += 1
                print(f'  [{locale}] {key}: {old!r} -> {new!r}')

    # 添加/更新 Powered by（放在 translation 内）
    powered_by = POWERED_BY_TRANSLATIONS.get(locale, 'Powered by')
    if 'Powered by' not in translations:
        translations['Powered by'] = powered_by
        print(f'  [{locale}] 添加 Powered by: {powered_by!r}')
    else:
        translations['Powered by'] = powered_by
        print(f'  [{locale}] 更新 Powered by: {powered_by!r}')

    # 清理可能误放到根节点的 Powered by
    if 'Powered by' in data and data.keys() == {'translation', 'Powered by'}:
        del data['Powered by']
        print(f'  [{locale}] 清理根节点 Powered by')

    return data

def main():
    for path in sorted(LOCALES_DIR.glob('*.json')):
        locale = path.stem
        if locale not in POWERED_BY_TRANSLATIONS:
            print(f'跳过未知 locale: {locale}')
            continue
        print(f'处理 {locale}.json...')
        data = update_locale(path, locale)
        with path.open('w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f'  保存完成。')

if __name__ == '__main__':
    main()
