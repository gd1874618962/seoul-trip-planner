import math
import os
import random

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "images")
os.makedirs(OUT, exist_ok=True)

W, H = 1200, 900
S = 2
random.seed(2026)

INK = (34, 51, 59)
BLUE = (75, 123, 156)
MIST = (234, 242, 247)
CREAM = (247, 243, 234)
SAND = (234, 226, 210)
CORAL = (217, 123, 95)
SAGE = (126, 155, 133)
GOLD = (185, 154, 91)


def canvas():
    img = Image.new("RGBA", (W * S, H * S), CREAM)
    return img, ImageDraw.Draw(img)


def save(img, name):
    img.convert("RGB").resize((W, H), Image.LANCZOS).save(os.path.join(OUT, name), quality=90, optimize=True)
    print("saved", name)


def vgrad(size, top, bottom):
    w, h = size
    base = Image.new("RGB", (1, h))
    d = ImageDraw.Draw(base)
    for y in range(h):
        t = y / max(h - 1, 1)
        d.line([(0, y), (0, y)], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return base.resize((w, h))


def overlay_ellipse(img, box, fill, alpha, width=0):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse(box, fill=fill + (alpha,), outline=fill + (min(255, alpha + 40),), width=width)
    img.alpha_composite(layer)


def overlay_poly(img, xy, fill, alpha):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).polygon(xy, fill=fill + (alpha,))
    img.alpha_composite(layer)


def chopsticks(d, x1, y1, x2, y2, color=(168, 138, 90)):
    d.line([(x1, y1), (x2, y2)], fill=color, width=16)
    d.line([(x1 + 26, y1 + 6), (x2 + 26, y2 + 6)], fill=color, width=16)


def steam(img, cx, y0):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(3):
        x = cx - 90 + i * 90
        d.arc([x, y0 - 260, x + 180, y0], start=200, end=340, fill=(255, 255, 255, 110), width=16)
    img.alpha_composite(layer)


def sesame(d, cx, cy, rx, ry, n=46):
    for _ in range(n):
        x = cx + random.randint(-rx, rx)
        y = cy + random.randint(-ry, ry)
        d.ellipse([x, y, x + 16, y + 9], fill=(250, 244, 222))


def make_hero():
    img = Image.new("RGBA", (W * S, H * S))
    img.paste(vgrad((W * S, H * S), (26, 50, 63), (214, 160, 128)), (0, 0))
    d = ImageDraw.Draw(img)

    overlay_ellipse(img, [1500, 620, 2060, 1180], (247, 205, 158), 120)
    overlay_ellipse(img, [1640, 760, 1940, 1060], (255, 226, 184), 130)

    d.polygon(
        [
            (0, 1180), (260, 980), (520, 1130), (820, 950), (1120, 1140),
            (1460, 1010), (1800, 1180), (2140, 1030), (2400, 1160),
            (2400, 1360), (0, 1360),
        ],
        fill=(34, 68, 82),
    )
    d.polygon(
        [
            (0, 1260), (300, 1140), (640, 1240), (1020, 1110), (1420, 1250),
            (1860, 1130), (2200, 1260), (2400, 1200), (2400, 1420), (0, 1420),
        ],
        fill=(28, 52, 66),
    )

    buildings = [
        (0, 1320, 180), (220, 1360, 260), (430, 1300, 140), (610, 1330, 210),
        (860, 1290, 120), (1020, 1340, 230), (1290, 1300, 160), (1480, 1360, 280),
        (1800, 1300, 150), (1980, 1340, 260), (2280, 1300, 120),
    ]
    for x, y, h in buildings:
        d.rectangle([x, y - h, x + 150, y], fill=(24, 46, 58))
        for wx in range(x + 18, x + 140, 34):
            for wy in range(y - h + 18, y - 10, 30):
                if random.random() < 0.5:
                    d.rectangle([wx, wy, wx + 12, wy + 12], fill=(217, 170, 96))

    d.ellipse([1260, 1180, 1560, 1480], fill=(36, 78, 92))
    d.ellipse([1240, 1140, 1580, 1480], fill=(44, 90, 104))
    d.line([1410, 1140, 1410, 620], fill=(226, 236, 240), width=26)
    d.line([1410, 620, 1410, 520], fill=(226, 236, 240), width=10)
    d.ellipse([1280, 700, 1540, 820], fill=(230, 240, 244))
    d.ellipse([1320, 660, 1500, 740], fill=(230, 240, 244))
    overlay_ellipse(img, [1435, 480, 1495, 560], (255, 92, 84), 220)

    for bx in (300, 560, 820, 1080, 1340, 1600, 1860, 2120):
        d.arc([bx, 760, bx + 240, 960], start=200, end=340, fill=(40, 70, 82), width=14)

    water = Image.new("RGBA", img.size, (0, 0, 0, 0))
    wd = ImageDraw.Draw(water)
    wd.rectangle([0, 1420, W * S, H * S], fill=(38, 66, 78, 255))
    for i in range(9):
        y = 1480 + i * 46
        wd.line([(0, y), (W * S, y)], fill=(196, 190, 170, 42 + i * 10), width=12)
    img.alpha_composite(water)
    save(img, "seoul-hero.jpg")


def make_gamjatang():
    img, d = canvas()
    img.paste(vgrad((W * S, H * S), CREAM, SAND), (0, 0))
    overlay_ellipse(img, [240, 1050, 2160, 1730], (226, 212, 186), 255)
    overlay_ellipse(img, [700, 1150, 1700, 1470], (174, 152, 130), 150)
    d.ellipse([480, 620, 1920, 1400], fill=(116, 92, 82))
    d.ellipse([560, 700, 1840, 1320], fill=(206, 148, 100))
    overlay_ellipse(img, [700, 780, 1400, 1080], (236, 188, 138), 90)
    d.rounded_rectangle([880, 250, 1540, 560], radius=80, fill=(140, 112, 90))
    d.ellipse([880, 250, 1540, 420], fill=(158, 128, 102))

    bones = [(1050, 900), (1320, 1000), (1500, 860)]
    for bx, by in bones:
        d.ellipse([bx - 90, by - 60, bx + 40, by + 60], fill=(224, 194, 162), outline=(160, 118, 88), width=10)
        d.ellipse([bx + 40, by - 90, bx + 200, by + 90], fill=(228, 200, 168), outline=(160, 118, 88), width=10)
        d.rounded_rectangle([bx + 40, by - 46, bx + 200, by + 46], radius=46, fill=(228, 200, 168), outline=(160, 118, 88), width=10)

    for px, py in [(760, 1080), (980, 1180), (1560, 1120), (1700, 980)]:
        d.ellipse([px - 70, py - 55, px + 70, py + 55], fill=(238, 216, 152), outline=(196, 154, 92), width=8)

    for gx in range(680, 1780, 170):
        d.line([(gx, 830), (gx + 60, 1230)], fill=(86, 138, 96), width=14)
    for i in range(26):
        x = 640 + random.randint(0, 1120)
        y = 820 + random.randint(0, 430)
        d.ellipse([x, y, x + 18, y + 18], fill=(198, 84, 62))

    chopsticks(d, 1960, 260, 1680, 620)
    steam(img, 1200, 1150)
    save(img, "food-gamjatang.jpg")


def make_dakbal():
    img, d = canvas()
    img.paste(vgrad((W * S, H * S), MIST, CREAM), (0, 0))
    overlay_ellipse(img, [260, 1020, 2140, 1720], (222, 210, 190), 255)
    overlay_ellipse(img, [660, 1120, 1740, 1490], (168, 152, 136), 150)
    d.ellipse([540, 640, 1860, 1430], fill=(250, 248, 242))
    d.ellipse([560, 660, 1840, 1410], fill=(250, 248, 242), outline=(226, 220, 208), width=8)
    d.ellipse([660, 780, 1740, 1320], fill=(205, 84, 58))
    d.ellipse([780, 880, 1480, 1180], fill=(222, 106, 74))

    feet = [(920, 980), (1250, 1040), (1500, 940), (1120, 1180)]
    for fx, fy in feet:
        d.ellipse([fx - 34, fy - 34, fx + 34, fy + 34], fill=(172, 56, 44))
        for ang in (-50, 0, 50):
            ex = fx + int(150 * math.cos(math.radians(ang)))
            ey = fy + int(150 * math.sin(math.radians(ang)))
            d.line([(fx, fy), (ex, ey)], fill=(172, 56, 44), width=26)
            d.ellipse([ex - 24, ey - 24, ex + 24, ey + 24], fill=(172, 56, 44))
        overlay_ellipse(img, [fx - 18, fy - 34, fx + 10, fy + 6], (255, 255, 255), 70)

    sesame(d, 1200, 1050, 480, 220, 70)
    for px, py in [(640, 880), (1740, 1120)]:
        d.rounded_rectangle([px - 34, py - 130, px + 34, py + 40], radius=34, fill=(198, 60, 44))
        d.line([(px, py - 130), (px, py - 190)], fill=(86, 138, 96), width=14)
        d.line([(px - 26, py - 150), (px + 26, py - 150)], fill=(86, 138, 96), width=12)
    d.ellipse([1820, 720, 2160, 1060], fill=SAGE)
    d.line([(1990, 1060), (1990, 1180)], fill=(78, 110, 86), width=12)
    chopsticks(d, 2040, 240, 1780, 600)
    save(img, "food-dakbal.jpg")


def make_gejang():
    img, d = canvas()
    img.paste(vgrad((W * S, H * S), SAND, CREAM), (0, 0))
    overlay_ellipse(img, [260, 1020, 2140, 1720], (224, 208, 178), 255)
    overlay_ellipse(img, [600, 1140, 1800, 1520], (168, 148, 120), 150)
    d.ellipse([460, 600, 1940, 1480], fill=(250, 248, 242))
    d.ellipse([480, 620, 1920, 1460], fill=(250, 248, 242), outline=(228, 220, 206), width=8)

    crabs = [(1050, 950), (1500, 1090)]
    for cx, cy in crabs:
        d.ellipse([cx - 250, cy - 170, cx + 250, cy + 170], fill=(196, 82, 64))
        d.ellipse([cx - 190, cy - 120, cx + 190, cy + 120], fill=(210, 98, 74))
        for side in (-1, 1):
            ax = cx + side * 300
            d.line([(cx + side * 150, cy - 40), (ax, cy - 110)], fill=(178, 68, 54), width=34)
            d.ellipse([ax - 74, cy - 186, ax + 74, cy - 38], fill=(190, 76, 58))
        for ang in range(-60, 70, 30):
            ex = cx + int(270 * math.cos(math.radians(ang)))
            ey = cy + int(170 * math.sin(math.radians(ang)))
            d.line([(cx, cy), (ex, ey)], fill=(178, 68, 54), width=20)
        overlay_ellipse(img, [cx - 120, cy - 120, cx - 10, cy - 20], (255, 255, 255), 80)
        d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=(138, 96, 80))

    d.rounded_rectangle([620, 1260, 1040, 1510], radius=70, fill=(250, 250, 248), outline=(224, 216, 202), width=8)
    d.ellipse([650, 1180, 1010, 1340], fill=(250, 250, 248))
    for _ in range(30):
        x = 670 + random.randint(0, 320)
        y = 1220 + random.randint(0, 60)
        d.ellipse([x, y, x + 12, y + 7], fill=(226, 218, 198))
    d.ellipse([620, 1180, 1040, 1340], outline=(224, 216, 202), width=8)

    for lx, ly in [(1180, 720), (1640, 820)]:
        d.ellipse([lx - 90, ly - 60, lx + 90, ly + 60], fill=SAGE)
        d.line([(lx, ly + 60), (lx, ly + 130)], fill=(78, 110, 86), width=12)
    chopsticks(d, 2050, 260, 1780, 620)
    save(img, "food-gejang.jpg")


def make_bbq():
    img, d = canvas()
    img.paste(vgrad((W * S, H * S), CREAM, SAND), (0, 0))
    overlay_ellipse(img, [240, 1020, 2160, 1720], (228, 214, 190), 255)
    d.rounded_rectangle([300, 640, 2100, 1540], radius=120, fill=(62, 62, 66))
    d.rounded_rectangle([360, 700, 2040, 1300], radius=80, fill=(96, 68, 60))
    for i in range(16):
        x = 420 + i * 106
        overlay_ellipse(img, [x, 1180, x + 70, 1280], (238, 150, 66), 160)
        overlay_ellipse(img, [x + 16, 1130, x + 56, 1210], (250, 202, 92), 170)
    for i in range(13):
        y = 760 + i * 46
        d.line([(380, y), (2020, y)], fill=(40, 40, 44), width=10)
    for i in range(9):
        x = 460 + i * 190
        d.line([(x, 720), (x, 1270)], fill=(40, 40, 44), width=10)

    meats = [(620, 900), (980, 860), (1320, 940), (1660, 880), (1120, 1100)]
    for mx, my in meats:
        d.rounded_rectangle([mx - 150, my - 90, mx + 150, my + 90], radius=50, fill=(176, 96, 74))
        d.rounded_rectangle([mx - 130, my - 70, mx + 130, my + 70], radius=44, fill=(192, 112, 84))
        for i in range(3):
            wy = my - 50 + i * 40
            d.line([(mx - 110, wy), (mx + 110, wy + 18)], fill=(232, 214, 192), width=10)
        for i in range(3):
            wy = my - 30 + i * 28
            d.line([(mx - 90, wy), (mx + 90, wy)], fill=(146, 74, 58), width=8)

    overlay_poly(img, [(900, 460), (1050, 520), (960, 760), (820, 700)], (238, 238, 240), 160)
    overlay_poly(img, [(1380, 440), (1530, 500), (1440, 740), (1300, 680)], (238, 238, 240), 150)
    d.line([(700, 1500), (850, 1420)], fill=(176, 144, 94), width=20)
    d.line([(790, 1530), (940, 1450)], fill=(176, 144, 94), width=20)

    for cx, cy, col in [(520, 1180, (190, 78, 58)), (1860, 1160, (226, 196, 118)), (520, 1420, SAGE)]:
        d.ellipse([cx - 90, cy - 90, cx + 90, cy + 90], fill=col)
    save(img, "food-bbq.jpg")


make_hero()
make_gamjatang()
make_dakbal()
make_gejang()
make_bbq()
