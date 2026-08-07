import re

path = r"C:\Users\PC\Documents\丽笙酒店\seoul-trip-planner\src\data\trip.js"
with open(path, encoding="utf-8") as fh:
    text = fh.read()


def point_repl(match):
    return f"{match.group(1)}{match.group(2)}{match.group(3)}locationId: 'loc-{match.group(2)}', "


text = re.sub(r"^(\s*\{ id: )(\d+)(, )", point_repl, text, flags=re.M)

lines = text.splitlines(keepends=True)
in_days = False
in_entries = False
day_num = 0
entry_num = 0
out = []
for line in lines:
    if line.startswith("export const days = ["):
        in_days = True
        out.append(line)
        continue
    if in_days:
        m = re.match(r"^    id: (\d+),", line)
        if m:
            day_num = int(m.group(1))
            entry_num = 0
            out.append(line)
            continue
        if re.match(r"^    entries: \[", line):
            in_entries = True
            out.append(line)
            continue
        if in_entries and re.match(r"^      \{$", line):
            entry_num += 1
            out.append(line)
            out.append(f"        id: 'd{day_num}-e{entry_num}',\n")
            continue
        if in_entries and re.match(r"^    \],", line):
            in_entries = False
    out.append(line)
text = "".join(out)


def loc_repl(match):
    indent = match.group(1)
    num = match.group(2)
    return f"{indent}pointIds: [{num}],\n{indent}locationId: 'loc-{num}',"


text = re.sub(r"^(\s*)pointIds: \[(\d+)\],", loc_repl, text, flags=re.M)


def locs_repl(match):
    indent = match.group(1)
    nums = [n.strip() for n in match.group(2).split(",")]
    ids = ", ".join(f"'loc-{n}'" for n in nums)
    return f"{indent}pointIds: [{', '.join(nums)}],\n{indent}locationIds: [{ids}],"


text = re.sub(r"^(\s*)pointIds: \[(\d+),\s*(\d+)\],", locs_repl, text, flags=re.M)

with open(path, "w", encoding="utf-8", newline="\n") as fh:
    fh.write(text)

print("trip.js updated")
