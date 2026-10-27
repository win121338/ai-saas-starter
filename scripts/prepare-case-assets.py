"""Inspect, crop and verify collected case assets without generative editing.

Requires Pillow from the bundled workspace Python runtime. Run from any folder:
  python scripts/prepare-case-assets.py inspect
  python scripts/prepare-case-assets.py initialize
  python scripts/prepare-case-assets.py export
  python scripts/prepare-case-assets.py verify
  python scripts/prepare-case-assets.py report

Per-image decisions live in content/case-templates/<slug>/template.json.
Original files are copied and hash-checked, never deleted or overwritten.
"""

import hashlib
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat


ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content" / "case-templates"
REVIEW = CONTENT / "_review"
GROUPS = {
    "case1": "blue-paper-comic",
    "case2": "color-block-manga",
    "case3": "bold-marker-doodle",
}
VERSION = "pixel-crop-v1"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checked_path(base, relative):
    path = (base / relative).resolve()
    if not path.is_relative_to(base.resolve()):
        raise ValueError(f"Path outside expected root: {relative}")
    return path


def source_directory(folder):
    incoming = checked_path(ROOT / "public" / "cases", folder)
    return incoming if incoming.is_dir() else checked_path(CONTENT / "_intake", folder)


def font(size=18):
    return ImageFont.truetype("C:/Windows/Fonts/arial.ttf", size)


def sheet(items, destination, columns, cell_width, cell_height):
    rows = (len(items) + columns - 1) // columns
    canvas = Image.new("RGB", (columns * cell_width, rows * cell_height), "#20242c")
    draw = ImageDraw.Draw(canvas)
    for index, (label, path) in enumerate(items):
        x = (index % columns) * cell_width
        y = (index // columns) * cell_height
        with Image.open(path) as source:
            preview = source.convert("RGB")
            preview.thumbnail((cell_width - 16, cell_height - 38), Image.Resampling.LANCZOS)
            canvas.paste(preview, (x + (cell_width - preview.width) // 2, y + 30))
        draw.text((x + 10, y + 6), label, fill="white", font=font(16))
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, quality=94, subsampling=0)


def inspect():
    inventory = []
    for folder, slug in GROUPS.items():
        files = sorted(source_directory(folder).glob("*.png"), key=lambda p: int(p.stem))
        sheet([(f"{folder}/{p.name}", p) for p in files], REVIEW / f"{folder}-sources.jpg", 5, 256, 580)
        for path in files:
            with Image.open(path) as source:
                rgb = source.convert("RGB")
                strip = rgb.resize((1, rgb.height), Image.Resampling.BOX)
                changes = []
                for y in range(250, min(rgb.height - 1, 2350)):
                    if 1050 < y < 1700:
                        continue
                    delta = sum(abs(a - b) for a, b in zip(strip.getpixel((0, y)), strip.getpixel((0, y - 1)))) / 3
                    if delta > 12:
                        changes.append([y, round(delta, 1)])
                # Uniform screenshot side padding makes the photo boundary measurable.
                photo_rows = {}
                for y in (400, 500, 600, 700, 780):
                    if y >= rgb.height:
                        continue
                    edge = rgb.getpixel((0, y))
                    content = [x for x in range(rgb.width) if max(abs(a - b) for a, b in zip(rgb.getpixel((x, y)), edge)) > 8]
                    photo_rows[str(y)] = [min(content), max(content) + 1] if content else None
                item = {"file": f"{folder}/{path.name}", "size": list(rgb.size), "rowChanges": changes, "photoSpans": photo_rows}
                inventory.append(item)
                print(json.dumps(item))
    (REVIEW / "source-inventory.json").write_text(json.dumps(inventory, indent=2) + "\n", encoding="utf-8")


def crop_image(source, rectangle):
    x, y, width, height = rectangle
    if min(x, y) < 0 or min(width, height) <= 0 or x + width > source.width or y + height > source.height:
        raise ValueError(f"Invalid crop rectangle: {rectangle}")
    return source.crop((x, y, x + width, y + height))


def initialize():
    intake = json.loads((REVIEW / "intake.json").read_text(encoding="utf-8"))
    crops = {row["file"]: row["before"] for row in json.loads((REVIEW / "photo-crops.json").read_text(encoding="utf-8"))}
    for group in intake:
        base = CONTENT / group["id"]
        base.mkdir(parents=True, exist_ok=True)
        path = base / "template.json"
        if path.exists():
            print(f"{group['id']}: existing manifest retained")
            continue
        manifest = {key: value for key, value in group.items() if key not in ("folder", "caseIntake")}
        manifest.update({
            "schemaVersion": 1,
            "status": "draft",
            "provenance": "collected-reference",
            "source": {"platform": "douyin", "url": None, "author": None, "visibleSignature": None if group["id"] == "color-block-manga" else "wibi"},
            "displayPermission": "unknown",
            "prompt": {"original": "p.md", "prepared": "prompt-v1.md", "version": 1, "referenceRequired": group["id"] != "blue-paper-comic", "referenceFiles": []},
            "generation": {"tested": False, "model": None, "publishedStyleSlug": None, "publishedPromptVersion": None, "testReport": None},
            "processingDate": "2026-10-26",
            "cases": [],
        })
        for index, item in enumerate(group["caseIntake"], start=1):
            before = crops[f"{group['folder']}/{index}.png"]
            manifest["cases"].append({
                "id": f"{index:03d}", "title": item["title"], "titleEn": item["titleEn"], "subjectTags": item.get("subjectTags", ["portrait"]),
                "sourceFile": f"originals/{index}.png", "sourceSha256": None, "sourceSize": None,
                "cropRects": {"before": before, "after": [0, 785, 1206, 1206], "compare": [0, 383, 1206, 1608]},
                "assets": dict.fromkeys(("before", "after", "compare", "thumb")),
                "assetSizes": dict.fromkeys(("before", "after", "compare", "thumb")),
                "alt": {"zh": item["altZh"], "en": item["altEn"]},
                "review": "pending", "notes": item.get("notes", []),
            })
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{group['id']}: initialized {len(manifest['cases'])} cases")


def preserve(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if digest(source) != digest(target):
            raise ValueError(f"Existing original differs; refusing overwrite: {target}")
    else:
        shutil.copy2(source, target)
    if digest(source) != digest(target):
        raise ValueError(f"Original copy hash mismatch: {target}")


def export():
    for folder, slug in GROUPS.items():
        base = CONTENT / slug
        manifest_path = base / "template.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        preserve(source_directory(folder) / "p.md", base / "p.md")
        (base / "references").mkdir(exist_ok=True)
        review_items = []
        for case in manifest["cases"]:
            source_path = source_directory(folder) / Path(case["sourceFile"]).name
            original_path = checked_path(base, case["sourceFile"])
            preserve(source_path, original_path)
            source_hash = digest(original_path)
            if case.get("sourceSha256") not in (None, source_hash):
                raise ValueError(f"Source changed; review before reprocessing: {source_path}")
            case["sourceSha256"] = source_hash
            with Image.open(original_path) as source:
                source = source.convert("RGB")
                case["sourceSize"] = list(source.size)
                output = ROOT / "public" / "cases" / slug
                output.mkdir(parents=True, exist_ok=True)
                processing_key = hashlib.sha256(json.dumps([VERSION, source_hash, case["cropRects"]], sort_keys=True).encode()).hexdigest()
                skip = case.get("processingKey") == processing_key and all(
                    value and checked_path(ROOT / "public", value.lstrip("/")).exists() for value in case["assets"].values()
                )
                for kind in ("before", "after", "compare", "thumb"):
                    image = crop_image(source, case["cropRects"]["after" if kind == "thumb" else kind])
                    if kind == "thumb":
                        image.thumbnail((640, 6400), Image.Resampling.LANCZOS)
                    filename = f"{case['id']}-{kind}.webp"
                    target = output / filename
                    if not skip:
                        image.save(target, "WEBP", lossless=kind != "thumb", quality=90, method=6)
                    case["assets"][kind] = f"/cases/{slug}/{filename}"
                    case["assetSizes"][kind] = list(image.size)
                    review_items.append((f"{case['id']} {kind} ({image.width}x{image.height})", target))
                case["processingKey"] = processing_key
                case["assetSha256"] = {kind: digest(output / f"{case['id']}-{kind}.webp") for kind in case["assets"]}
            print(f"{slug}/{case['id']}: {'unchanged' if skip else 'exported'}")
        manifest["processingVersion"] = VERSION
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        # Five cases per sheet: each row shows all four exported versions.
        for offset in range(0, len(review_items), 20):
            sheet(review_items[offset:offset + 20], REVIEW / f"{folder}-outputs-{offset // 20 + 1}.jpg", 4, 320, 420)
        sheet([(f"{slug}/{c['id']}", ROOT / "public" / c["assets"]["after"].lstrip("/")) for c in manifest["cases"]], REVIEW / f"{folder}-artworks.jpg", 5, 256, 286)


def verify():
    count = 0
    hashes = set()
    for folder, slug in GROUPS.items():
        base = CONTENT / slug
        manifest = json.loads((base / "template.json").read_text(encoding="utf-8"))
        ids = {case["id"] for case in manifest["cases"]}
        assert len(ids) == len(manifest["cases"]), "Duplicate case IDs"
        for selected in [manifest["coverCaseId"], manifest["comparisonCaseId"], *manifest["featuredCaseIds"]]:
            assert selected in ids, f"Unknown case reference: {selected}"
        assert digest(base / "p.md") == digest(source_directory(folder) / "p.md")
        for case in manifest["cases"]:
            original = checked_path(base, case["sourceFile"])
            assert digest(original) == case["sourceSha256"]
            assert digest(original) == digest(source_directory(folder) / original.name)
            assert case["sourceSha256"] not in hashes, f"Duplicate source: {original}"
            hashes.add(case["sourceSha256"])
            with Image.open(original) as source:
                source = source.convert("RGB")
                assert list(source.size) == case["sourceSize"]
                for kind, url in case["assets"].items():
                    path = checked_path(ROOT / "public", url.lstrip("/"))
                    with Image.open(path) as result:
                        result.load()
                        assert list(result.size) == case["assetSizes"][kind]
                        assert digest(path) == case["assetSha256"][kind]
                        expected = crop_image(source, case["cropRects"]["after" if kind == "thumb" else kind])
                        if kind == "thumb":
                            expected.thumbnail((640, 6400), Image.Resampling.LANCZOS)
                            error = ImageStat.Stat(ImageChops.difference(expected, result.convert("RGB"))).mean
                            assert max(error) < 8, f"Unexpected thumbnail error: {error}"
                        else:
                            assert ImageChops.difference(expected, result.convert("RGB")).getbbox() is None, f"Crop pixels changed: {path}"
                    count += 1
        print(f"{slug}: {len(ids)} sources, originals and all derived assets verified")
    print(f"Verified {len(hashes)} unique originals and {count} image assets; lossless crops match source pixels exactly.")


def report():
    decisions = json.loads((REVIEW / "visual-review.json").read_text(encoding="utf-8"))
    selected = []
    totals = []
    for folder, slug in GROUPS.items():
        base = CONTENT / slug
        path = base / "template.json"
        manifest = json.loads(path.read_text(encoding="utf-8"))
        decision = decisions["groups"][slug]
        assert set(decision["passedCaseIds"]) == {case["id"] for case in manifest["cases"]}
        if manifest["status"] == "draft":
            manifest["status"] = "ready"
        manifest.setdefault("generationReady", False)
        manifest["source"]["visibleSignature"] = None if folder == "case2" else "wibi"
        for case in manifest["cases"]:
            case["review"] = "passed"
            case["notes"] = [
                "仅通过素材配对与裁剪导出检查；不是本站生成质量验证。",
                "原照来自截图提取，未放大、补画或生成修复。",
                *decision["notesByCase"].get(case["id"], []),
            ]
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        selected_case = next(case for case in manifest["cases"] if case["id"] == manifest["coverCaseId"])
        selected.append((f"{folder} / {selected_case['id']}", ROOT / "public" / selected_case["assets"]["after"].lstrip("/")))
        original_bytes = sum(checked_path(base, case["sourceFile"]).stat().st_size for case in manifest["cases"])
        exported_bytes = sum((ROOT / "public" / url.lstrip("/")).stat().st_size for case in manifest["cases"] for url in case["assets"].values())
        totals.append((folder, slug, len(manifest["cases"]), original_bytes, exported_bytes))
        lines = [
            f"# {manifest['name']['zh']} · 素材整理报告", "", "日期：2026-10-26", "",
            f"本次范围：最初收到的 `public/cases/{folder}`，完成规范阶段 A–C。原始输入现位于 `{source_directory(folder).relative_to(ROOT).as_posix()}`。", "",
            f"处理数量：{len(manifest['cases'])} 张输入，{len(manifest['cases'])} 组完成，0 组待裁剪复核，0 组排除；共 {len(manifest['cases']) * 4} 张衍生图。", "",
            f"输出位置：`public/cases/{slug}/`。原件副本位于本目录 `originals/`，原始 `p.md` 已按原字节复制。", "",
            "## 导出规格与核验", "",
            "- 原截图：1206×2622。每张成品：1206×1206。每张对比图：1206×1608。缩略图：640×640。",
            "- 成品裁剪框 `[0, 785, 1206, 1206]`；对比裁剪框 `[0, 383, 1206, 1608]`。所有截图均独立检查后确认共享这两个边界。",
            "- 原照宽度逐张测量，坐标见下表与 template.json；没有用统一宽度批裁。",
            "- before、after、compare 使用无损 WebP，解码像素与源截图对应区域完全一致；thumb 使用质量 90 的 WebP。",
            "- 所有原件及提示词副本通过 SHA-256 核对，25 张源图跨组未发现字节完全相同的重复文件。",
            "- 原照、成品、对比图、缩略图已通过逐图联系表视觉检查；程序另验证解码、尺寸、裁剪像素、缩略图误差与文件哈希。",
            "- 检查通过指素材导出正确；未运行生成模型，未验证提示词复现率。", "",
            f"源图大小：{original_bytes / 1048576:.2f} MiB；衍生图合计：{exported_bytes / 1048576:.2f} MiB。", "",
            "## 封面推荐", "",
            f"首选：`{manifest['coverCaseId']}`。{manifest['coverReason']}", "",
        ]
        for alternative in manifest["coverAlternatives"]:
            lines.append(f"- 备选 `{alternative['caseId']}`：{alternative['reason']}")
        lines.extend(["", "## 逐图记录", "", "| 案例 | 原照裁剪框 x,y,w,h | 成品 | 对比 | 缩略图 | 检查 |", "| --- | --- | --- | --- | --- | --- |"])
        for case in manifest["cases"]:
            links = [f"[{label}](../../../public{case['assets'][kind]})" for kind, label in (("after", "成品"), ("compare", "对比"), ("thumb", "缩略图"))]
            lines.append(f"| {case['id']} · {case['title']} | `{case['cropRects']['before']}` | {' | '.join(links)} | 通过 |")
        lines.extend(["", "## 已知差异与待补充", ""])
        lines.extend(f"- {item}" for item in manifest["suitability"]["limitations"])
        for case_id, notes in decision["notesByCase"].items():
            for note in notes:
                lines.append(f"- `{case_id}`：{note}")
        lines.extend([
            "- 来源平台为用户提供的抖音信息；来源链接、作者身份、公开推广使用情况及高清原始照片尚未补充。",
            f"- 原始输入完整保存在 `{source_directory(folder).relative_to(ROOT).as_posix()}`。" + ("已迁出 public，网页只保留裁剪后的展示图片。" if source_directory(folder).is_relative_to(CONTENT) else "仍在 public，发布前需迁移内部资料。"),
            "- 模板 status=ready 只表示资料与衍生图已整理，可进入接入审查；generationReady=false、tested=false，未绑定线上生成模板。",
            "", "## 复核预览", "",
        ])
        lines.extend(f"- [输出检查表 {index + 1}](../_review/{name})" for index, name in enumerate(decision["outputSheets"]))
        lines.extend(["", "下一步：补齐参考图等资料，另行接入页面或进行已授权的模型测试。", ""])
        (base / "processing-report.md").write_text("\n".join(lines), encoding="utf-8")
    sheet(selected, REVIEW / "selected-covers.jpg", 3, 500, 530)
    print(json.dumps({"groups": totals, "sourceCount": sum(row[2] for row in totals), "assetCount": sum(row[2] for row in totals) * 4}))


if __name__ == "__main__":
    actions = {"inspect": inspect, "initialize": initialize, "export": export, "verify": verify, "report": report}
    if len(sys.argv) != 2 or sys.argv[1] not in actions:
        raise SystemExit("Usage: prepare-case-assets.py inspect|initialize|export|verify|report")
    actions[sys.argv[1]]()
