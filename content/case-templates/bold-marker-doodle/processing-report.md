# 今天有点小脾气 · 素材整理报告

日期：2026-10-26

本次范围：最初收到的 `public/cases/case3`，完成规范阶段 A–C。原始输入现位于 `content/case-templates/_intake/case3`。

处理数量：7 张输入，7 组完成，0 组待裁剪复核，0 组排除；共 28 张衍生图。

输出位置：`public/cases/bold-marker-doodle/`。原件副本位于本目录 `originals/`，原始 `p.md` 已按原字节复制。

## 导出规格与核验

- 原截图：1206×2622。每张成品：1206×1206。每张对比图：1206×1608。缩略图：640×640。
- 成品裁剪框 `[0, 785, 1206, 1206]`；对比裁剪框 `[0, 383, 1206, 1608]`。所有截图均独立检查后确认共享这两个边界。
- 原照宽度逐张测量，坐标见下表与 template.json；没有用统一宽度批裁。
- before、after、compare 使用无损 WebP，解码像素与源截图对应区域完全一致；thumb 使用质量 90 的 WebP。
- 所有原件及提示词副本通过 SHA-256 核对，25 张源图跨组未发现字节完全相同的重复文件。
- 原照、成品、对比图、缩略图已通过逐图联系表视觉检查；程序另验证解码、尺寸、裁剪像素、缩略图误差与文件哈希。
- 检查通过指素材导出正确；未运行生成模型，未验证提示词复现率。

源图大小：8.89 MiB；衍生图合计：10.22 MiB。

## 封面推荐

首选：`006`。红色章鱼帽、双手动作与蓝色上衣辨识度高，可与另外两组的漫画风格拉开距离。

- 备选 `007`：人与狗同时吐舌头，原照与成品的情绪对应直观，适合宠物入口。
- 备选 `001`：白衬衫、领带和饮料动作简洁，适合表现日常照片转换。

## 逐图记录

| 案例 | 原照裁剪框 x,y,w,h | 成品 | 对比 | 缩略图 | 检查 |
| --- | --- | --- | --- | --- | --- |
| 001 · 上班也要喝一口 | `[402, 383, 402, 402]` | [成品](../../../public/cases/bold-marker-doodle/001-after.webp) | [对比](../../../public/cases/bold-marker-doodle/001-compare.webp) | [缩略图](../../../public/cases/bold-marker-doodle/001-thumb.webp) | 通过 |
| 002 · 戴上耳机开饭 | `[350, 383, 506, 402]` | [成品](../../../public/cases/bold-marker-doodle/002-after.webp) | [对比](../../../public/cases/bold-marker-doodle/002-compare.webp) | [缩略图](../../../public/cases/bold-marker-doodle/002-thumb.webp) | 通过 |
| 003 · 先吃这一口 | `[402, 383, 402, 402]` | [成品](../../../public/cases/bold-marker-doodle/003-after.webp) | [对比](../../../public/cases/bold-marker-doodle/003-compare.webp) | [缩略图](../../../public/cases/bold-marker-doodle/003-thumb.webp) | 通过 |
| 004 · 双份甜也要开心 | `[402, 383, 402, 402]` | [成品](../../../public/cases/bold-marker-doodle/004-after.webp) | [对比](../../../public/cases/bold-marker-doodle/004-compare.webp) | [缩略图](../../../public/cases/bold-marker-doodle/004-thumb.webp) | 通过 |
| 005 · 披萨大口吃 | `[450, 383, 339, 402]` | [成品](../../../public/cases/bold-marker-doodle/005-after.webp) | [对比](../../../public/cases/bold-marker-doodle/005-compare.webp) | [缩略图](../../../public/cases/bold-marker-doodle/005-thumb.webp) | 通过 |
| 006 · 章鱼帽出游记 | `[288, 383, 631, 402]` | [成品](../../../public/cases/bold-marker-doodle/006-after.webp) | [对比](../../../public/cases/bold-marker-doodle/006-compare.webp) | [缩略图](../../../public/cases/bold-marker-doodle/006-thumb.webp) | 通过 |
| 007 · 和狗狗一起吐舌头 | `[326, 383, 503, 402]` | [成品](../../../public/cases/bold-marker-doodle/007-after.webp) | [对比](../../../public/cases/bold-marker-doodle/007-compare.webp) | [缩略图](../../../public/cases/bold-marker-doodle/007-thumb.webp) | 通过 |

## 已知差异与待补充

- 马克笔风格参考图未提供，无法确认完整复现条件。
- 样图含个人署名，项目版提示词不要求复制该署名。
- 部分样图超过严格四色或改变表情，参考作品与提示词并非逐项一致。
- 复杂多人和纯宠物照片待验证。
- `001`：封面备选；饮料杯、领带与已有签名保留。
- `003`：原照含背景食客，现有成品只画前景主体；这是源作品与提示词人数规则的差异，并非本次裁剪造成。
- `006`：封面首选；红色章鱼帽与双手动作完整保留。
- `007`：封面备选；人和狗均完整保留，已有签名未擦除。
- 来源平台为用户提供的抖音信息；来源链接、作者身份、公开推广使用情况及高清原始照片尚未补充。
- 原始输入完整保存在 `content/case-templates/_intake/case3`。已迁出 public，网页只保留裁剪后的展示图片。
- 模板 status=ready 只表示资料与衍生图已整理，可进入接入审查；generationReady=false、tested=false，未绑定线上生成模板。

## 复核预览

- [输出检查表 1](../_review/case3-outputs-1.jpg)
- [输出检查表 2](../_review/case3-outputs-2.jpg)

下一步：补齐参考图等资料，另行接入页面或进行已授权的模型测试。
