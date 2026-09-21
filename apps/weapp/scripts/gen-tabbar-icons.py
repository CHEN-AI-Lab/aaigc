#!/usr/bin/env python3
"""生成 tabBar 本地 PNG 图标（微信 tabBar 不支持远程图标，必须打包内本地 png）。

只依赖标准库（zlib + struct），不引入 Pillow。
输出：apps/weapp/src/assets/tabbar/{tools,me}{,-active}.png，81x81 RGBA。
"""
import os
import struct
import zlib

SIZE = 81
NORMAL = (0x76, 0x7D, 0x88)   # --color-text-secondary
ACTIVE = (0xFA, 0x52, 0x0F)   # --color-accent


def blank():
    return [[(0, 0, 0, 0) for _ in range(SIZE)] for _ in range(SIZE)]


def fill_rect(px, x0, y0, x1, y1, color):
    for y in range(max(0, y0), min(SIZE, y1)):
        for x in range(max(0, x0), min(SIZE, x1)):
            px[y][x] = (color[0], color[1], color[2], 255)


def fill_circle(px, cx, cy, r, color):
    for y in range(max(0, cy - r), min(SIZE, cy + r + 1)):
        for x in range(max(0, cx - r), min(SIZE, cx + r + 1)):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                px[y][x] = (color[0], color[1], color[2], 255)


def fill_ring(px, cx, cy, outer, inner, color):
    for y in range(max(0, cy - outer), min(SIZE, cy + outer + 1)):
        for x in range(max(0, cx - outer), min(SIZE, cx + outer + 1)):
            d = (x - cx) ** 2 + (y - cy) ** 2
            if inner * inner <= d <= outer * outer:
                px[y][x] = (color[0], color[1], color[2], 255)


def icon_tools(color):
    """3x3 宫格（工具列表）"""
    px = blank()
    cell, gap, origin = 17, 7, 12
    for row in range(3):
        for col in range(3):
            x0 = origin + col * (cell + gap)
            y0 = origin + row * (cell + gap)
            fill_rect(px, x0, y0, x0 + cell, y0 + cell, color)
    return px


def icon_me(color):
    """头 + 肩（我的）"""
    px = blank()
    fill_circle(px, 40, 27, 15, color)          # 头
    fill_circle(px, 40, 74, 30, color)          # 肩（下半超出画布，视觉上是半圆）
    # 挖掉肩与头之间的空隙，避免连成一块
    for y in range(40, 50):
        for x in range(0, SIZE):
            if (x - 40) ** 2 + (y - 74) ** 2 > 30 * 30:
                px[y][x] = (0, 0, 0, 0)
    return px


def write_png(path, px):
    raw = b''
    for row in px:
        raw += b'\x00'  # filter type 0
        for (r, g, b, a) in row:
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack('>IIBBBBB', SIZE, SIZE, 8, 6, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as fh:
        fh.write(png)
    return len(png)


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, '..', 'src', 'assets', 'tabbar')
    out = os.path.normpath(out)

    jobs = [
        ('tools.png', icon_tools(NORMAL)),
        ('tools-active.png', icon_tools(ACTIVE)),
        ('me.png', icon_me(NORMAL)),
        ('me-active.png', icon_me(ACTIVE)),
    ]
    for name, px in jobs:
        size = write_png(os.path.join(out, name), px)
        print(f'[gen-tabbar] {name} {size} bytes')


if __name__ == '__main__':
    main()
