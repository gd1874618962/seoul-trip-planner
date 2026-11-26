from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "public" / "icons"
SPLASH = ROOT / "public" / "splash"
CREAM = "#FBF8F2"
INK = "#2F2B26"
ACCENT = "#775736"
CLAY = "#B6573F"
SAGE = "#2F716D"


def font(size):
    candidates = [
        Path("C:/Windows/Fonts/msyhbd.ttc"),
        Path("C:/Windows/Fonts/msyh.ttc"),
        Path("C:/Windows/Fonts/simhei.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def draw_mark(image, box, dark_background=False):
    draw = ImageDraw.Draw(image)
    left, top, right, bottom = box
    width = right - left
    foreground = CREAM if dark_background else ACCENT
    line_width = max(10, width // 14)

    draw.arc(
        (
            int(left + width * 0.08),
            int(top + width * 0.1),
            int(right - width * 0.08),
            int(bottom - width * 0.08),
        ),
        200,
        340,
        fill=foreground,
        width=int(line_width),
    )
    route = [
        (left + width * 0.17, top + width * 0.69),
        (left + width * 0.37, top + width * 0.49),
        (left + width * 0.58, top + width * 0.59),
        (left + width * 0.82, top + width * 0.32),
    ]
    route = [(int(x), int(y)) for x, y in route]
    draw.line(route, fill=foreground, width=int(line_width), joint="curve")
    dot = max(8, width // 24)
    for index, (x, y) in enumerate(route):
        color = CLAY if index == len(route) - 1 else foreground
        draw.ellipse((x - dot, y - dot, x + dot, y + dot), fill=color)
    draw.line(
        [
            (int(left + width * 0.63), int(top + width * 0.79)),
            (int(right - width * 0.16), int(top + width * 0.79)),
        ],
        fill=SAGE if dark_background else INK,
        width=int(max(6, line_width // 2)),
    )


def square_icon(path, size, maskable=False):
    image = Image.new("RGB", (size, size), ACCENT if maskable else CREAM)
    draw = ImageDraw.Draw(image)
    if not maskable:
        inset = int(size * 0.08)
        draw.rounded_rectangle(
            (inset, inset, size - inset, size - inset),
            radius=int(size * 0.22),
            fill=ACCENT,
        )
    padding = size * (0.22 if maskable else 0.2)
    draw_mark(image, (padding, padding, size - padding, size - padding), dark_background=True)
    image.save(path, quality=95)


def splash_image(path, width, height):
    image = Image.new("RGB", (width, height), CREAM)
    draw = ImageDraw.Draw(image)
    mark_size = int(min(width, height) * 0.22)
    left = (width - mark_size) // 2
    top = int(height * 0.35)
    draw.rounded_rectangle(
        (left, top, left + mark_size, top + mark_size),
        radius=int(mark_size * 0.22),
        fill=ACCENT,
    )
    draw_mark(
        image,
        (
            left + mark_size * 0.2,
            top + mark_size * 0.2,
            left + mark_size * 0.8,
            top + mark_size * 0.8,
        ),
        dark_background=True,
    )
    title_font = font(max(42, int(width * 0.075)))
    sub_font = font(max(20, int(width * 0.028)))
    title = "小韩之旅"
    subtitle = "TRAVEL JOURNAL"
    title_box = draw.textbbox((0, 0), title, font=title_font)
    subtitle_box = draw.textbbox((0, 0), subtitle, font=sub_font)
    title_x = (width - (title_box[2] - title_box[0])) / 2
    subtitle_x = (width - (subtitle_box[2] - subtitle_box[0])) / 2
    draw.text((title_x, top + mark_size + 44), title, font=title_font, fill=INK)
    draw.text(
        (subtitle_x, top + mark_size + 44 + (title_box[3] - title_box[1]) + 16),
        subtitle,
        font=sub_font,
        fill=ACCENT,
    )
    image.save(path, quality=92)


def main():
    ICONS.mkdir(parents=True, exist_ok=True)
    SPLASH.mkdir(parents=True, exist_ok=True)
    square_icon(ICONS / "icon-192.png", 192)
    square_icon(ICONS / "icon-512.png", 512)
    square_icon(ICONS / "icon-maskable-512.png", 512, maskable=True)
    square_icon(ICONS / "apple-touch-icon.png", 180)
    splash_image(SPLASH / "apple-splash-750x1334.jpg", 750, 1334)
    splash_image(SPLASH / "apple-splash-1170x2532.jpg", 1170, 2532)
    splash_image(SPLASH / "apple-splash-1290x2796.jpg", 1290, 2796)
    print("Generated PWA icons and Apple splash screens.")


if __name__ == "__main__":
    main()
