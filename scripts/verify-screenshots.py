from pathlib import Path

from PIL import Image, ImageStat


ROOT = Path(__file__).resolve().parent.parent / "shots" / "visual-unified"


def main():
    images = sorted(ROOT.glob("*.jpg"))
    if not images:
        raise SystemExit("No review screenshots found.")

    failures = []
    for path in images:
        with Image.open(path) as image:
            image = image.convert("RGB")
            stat = ImageStat.Stat(image)
            spread = max(channel[1] - channel[0] for channel in image.getextrema())
            unique = len(image.resize((120, 120)).getcolors(maxcolors=120 * 120) or [])
            mean = tuple(round(value) for value in stat.mean)
            print(
                f"{path.name}: {image.width}x{image.height}, "
                f"mean={mean}, channelspread={spread}, samplecolors={unique}"
            )
            if image.width < 360 or image.height < 600:
                failures.append(f"{path.name}: image is unexpectedly small")
            if spread < 32 or unique < 24:
                failures.append(f"{path.name}: image appears blank or visually flat")

    if failures:
        raise SystemExit("\n".join(failures))
    print(f"Screenshot verification passed for {len(images)} captures.")


if __name__ == "__main__":
    main()
