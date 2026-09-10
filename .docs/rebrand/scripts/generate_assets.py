import io
import sys
import struct
from pathlib import Path
from PIL import Image

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# 路径配置
PROJECT_ROOT = Path(r'E:\xWorkshop\micross-api')
SOURCE_LOGO = Path(r'D:\xDev-Cache\Temp\microsslink.93847da649.png')
OUTPUT_DIR = PROJECT_ROOT / 'web' / 'public'
WORK_ASSETS_DIR = PROJECT_ROOT / '.docs' / 'rebrand' / 'assets'

# 目标尺寸
LOGO_SIZE = (180, 180)          # 与原有 logo.png 一致
FAVICON_SIZES = [16, 32, 48]    # 多尺寸 ICO

def load_source() -> Image.Image:
    img = Image.open(SOURCE_LOGO).convert('RGBA')
    print(f'源图尺寸: {img.size}, 模式: {img.mode}')
    return img

def fit_into_square(src: Image.Image, size: int) -> Image.Image:
    """将非方形 Logo 等比缩放后居中放入透明方形画布。"""
    src_w, src_h = src.size
    scale = min(size / src_w, size / src_h)
    new_w = max(1, int(src_w * scale))
    new_h = max(1, int(src_h * scale))
    resized = src.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    offset = ((size - new_w) // 2, (size - new_h) // 2)
    canvas.paste(resized, offset, resized)
    return canvas

def generate_logo(src: Image.Image) -> Path:
    logo = fit_into_square(src, LOGO_SIZE[0])
    out_path = OUTPUT_DIR / 'logo.png'
    logo.save(out_path, 'PNG')
    # 同时在工作目录留一份备份
    backup_path = WORK_ASSETS_DIR / 'logo.png'
    logo.save(backup_path, 'PNG')
    print(f'生成 Logo: {out_path} ({logo.size})')
    return out_path

def build_ico_from_pngs(images: list[Image.Image]) -> bytes:
    """
    手工构造多尺寸 ICO 文件。
    现代 Windows / 浏览器支持 ICO 中嵌入 PNG 数据（BITMAP_TYPE=PNG）。
    """
    png_buffers: list[bytes] = []
    for img in images:
        buf = io.BytesIO()
        # PNG 模式在 ICO 中兼容性最好
        img.save(buf, format='PNG')
        png_buffers.append(buf.getvalue())

    count = len(images)
    # ICONDIR: Reserved(2) + Type(2) + Count(2)
    data = struct.pack('<HHH', 0, 1, count)

    # 每个 ICONDIRENTRY 16 字节，头部共 6 + 16*count 字节
    header_size = 6 + 16 * count
    offset = header_size
    for img, png_bytes in zip(images, png_buffers):
        w, h = img.size
        # 尺寸 256 需要用 0 表示
        width_byte = w if w < 256 else 0
        height_byte = h if h < 256 else 0
        size = len(png_bytes)
        # ICONDIRENTRY: width(1) height(1) colors(1) reserved(1) planes(2) bitcount(2) bytesize(4) offset(4)
        data += struct.pack(
            '<BBBBHHII',
            width_byte,
            height_byte,
            0,      # colors
            0,      # reserved
            1,      # color planes
            32,     # bits per pixel
            size,
            offset,
        )
        offset += size

    for png_bytes in png_buffers:
        data += png_bytes

    return data

def generate_favicon(src: Image.Image) -> Path:
    images = [fit_into_square(src, s) for s in FAVICON_SIZES]
    ico_bytes = build_ico_from_pngs(images)

    out_path = OUTPUT_DIR / 'favicon.ico'
    out_path.write_bytes(ico_bytes)
    backup_path = WORK_ASSETS_DIR / 'favicon.ico'
    backup_path.write_bytes(ico_bytes)

    print(f'生成 Favicon: {out_path} (尺寸: {FAVICON_SIZES}, 大小: {len(ico_bytes)} bytes)')
    return out_path

def main():
    WORK_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    src = load_source()
    generate_logo(src)
    generate_favicon(src)
    print('品牌资产生成完成。')

if __name__ == '__main__':
    main()
