import re

PATH = r"C:\Users\PC\Documents\丽笙酒店\seoul-trip-planner\src\data\shoppingProducts.js"

with open(PATH, encoding="utf-8") as fh:
    text = fh.read()

# Add helper after imports/const declarations
helper = (
    "const P = (n) =>\n"
    "  `/shopping/catalog/products/${encodeURIComponent(`商品 (${n})`)}.png`\n\n"
)
if "const P = (n) =>" not in text:
    text = text.replace("export const shoppingProducts = [", helper + "export const shoppingProducts = [")

counter = 0


def repl(match):
    global counter
    counter += 1
    return f"image: P({counter}),"


text = re.sub(r"image: IMG\.(p1a|p1b|p2a|p2b|p3),", repl, text)

with open(PATH, "w", encoding="utf-8", newline="\n") as fh:
    fh.write(text)

print("images updated:", counter)
