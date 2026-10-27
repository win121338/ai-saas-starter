# 把日常印成封面 · 素材整理报告

日期：2026-10-26

本次范围：最初收到的 `public/cases/case1`，完成规范阶段 A–C。原始输入现位于 `content/case-templates/_intake/case1`。

处理数量：10 张输入，10 组完成，0 组待裁剪复核，0 组排除；共 40 张衍生图。

输出位置：`public/cases/blue-paper-comic/`。原件副本位于本目录 `originals/`，原始 `p.md` 已按原字节复制。

## 导出规格与核验

- 原截图：1206×2622。每张成品：1206×1206。每张对比图：1206×1608。缩略图：640×640。
- 成品裁剪框 `[0, 785, 1206, 1206]`；对比裁剪框 `[0, 383, 1206, 1608]`。所有截图均独立检查后确认共享这两个边界。
- 原照宽度逐张测量，坐标见下表与 template.json；没有用统一宽度批裁。
- before、after、compare 使用无损 WebP，解码像素与源截图对应区域完全一致；thumb 使用质量 90 的 WebP。
- 所有原件及提示词副本通过 SHA-256 核对，25 张源图跨组未发现字节完全相同的重复文件。
- 原照、成品、对比图、缩略图已通过逐图联系表视觉检查；程序另验证解码、尺寸、裁剪像素、缩略图误差与文件哈希。
- 检查通过指素材导出正确；未运行生成模型，未验证提示词复现率。

源图大小：24.36 MiB；衍生图合计：31.93 MiB。

## 封面推荐

首选：`001`。喝水动作清楚，人物与 SLOW SIP 大字形成穿插，蓝纸风格在小图中仍容易识别。

- 备选 `007`：斜光、相机与人物轮廓有层次，适合补充摄影题材。
- 备选 `009`：双手持甜品与笑脸带来轻松情绪，适合精选区。

## 逐图记录

| 案例 | 原照裁剪框 x,y,w,h | 成品 | 对比 | 缩略图 | 检查 |
| --- | --- | --- | --- | --- | --- |
| 001 · SLOW SIP · 慢慢喝 | `[428, 383, 351, 402]` | [成品](../../../public/cases/blue-paper-comic/001-after.webp) | [对比](../../../public/cases/blue-paper-comic/001-compare.webp) | [缩略图](../../../public/cases/blue-paper-comic/001-thumb.webp) | 通过 |
| 002 · RIDE READY · 出发准备 | `[475, 383, 256, 402]` | [成品](../../../public/cases/blue-paper-comic/002-after.webp) | [对比](../../../public/cases/blue-paper-comic/002-compare.webp) | [缩略图](../../../public/cases/blue-paper-comic/002-thumb.webp) | 通过 |
| 003 · SLOW DAY · 慢一天 | `[426, 383, 355, 402]` | [成品](../../../public/cases/blue-paper-comic/003-after.webp) | [对比](../../../public/cases/blue-paper-comic/003-compare.webp) | [缩略图](../../../public/cases/blue-paper-comic/003-thumb.webp) | 通过 |
| 004 · QUIET STEP · 安静一阶 | `[425, 383, 357, 402]` | [成品](../../../public/cases/blue-paper-comic/004-after.webp) | [对比](../../../public/cases/blue-paper-comic/004-compare.webp) | [缩略图](../../../public/cases/blue-paper-comic/004-thumb.webp) | 通过 |
| 005 · STREET BITE · 街头一口 | `[423, 383, 360, 402]` | [成品](../../../public/cases/blue-paper-comic/005-after.webp) | [对比](../../../public/cases/blue-paper-comic/005-compare.webp) | [缩略图](../../../public/cases/blue-paper-comic/005-thumb.webp) | 通过 |
| 006 · WAIT MORE · 再坐一会 | `[425, 383, 356, 402]` | [成品](../../../public/cases/blue-paper-comic/006-after.webp) | [对比](../../../public/cases/blue-paper-comic/006-compare.webp) | [缩略图](../../../public/cases/blue-paper-comic/006-thumb.webp) | 通过 |
| 007 · FRAME PAUSE · 镜头暂停 | `[426, 383, 354, 402]` | [成品](../../../public/cases/blue-paper-comic/007-after.webp) | [对比](../../../public/cases/blue-paper-comic/007-compare.webp) | [缩略图](../../../public/cases/blue-paper-comic/007-thumb.webp) | 通过 |
| 008 · SWEET BITE · 西瓜一口 | `[440, 383, 326, 402]` | [成品](../../../public/cases/blue-paper-comic/008-after.webp) | [对比](../../../public/cases/blue-paper-comic/008-compare.webp) | [缩略图](../../../public/cases/blue-paper-comic/008-thumb.webp) | 通过 |
| 009 · SWEET DUO · 双份甜 | `[426, 383, 354, 402]` | [成品](../../../public/cases/blue-paper-comic/009-after.webp) | [对比](../../../public/cases/blue-paper-comic/009-compare.webp) | [缩略图](../../../public/cases/blue-paper-comic/009-thumb.webp) | 通过 |
| 010 · PHONE PAUSE · 手机暂停 | `[436, 383, 335, 402]` | [成品](../../../public/cases/blue-paper-comic/010-after.webp) | [对比](../../../public/cases/blue-paper-comic/010-compare.webp) | [缩略图](../../../public/cases/blue-paper-comic/010-thumb.webp) | 通过 |

## 已知差异与待补充

- 原照均为截图提取，不能当高清原片使用。
- 多人物、宠物与极暗场景的适用性待验证。
- 部分参考作品的顶部留白少于原提示词的约三分之一要求。
- `001`：封面首选；SLOW SIP 标题、蓝纸留白与喝水动作完整保留。
- `002`：原照仅 256×402 像素，适合小图；原照自行车本身已被拍摄边界截断，未补画。
- `007`：封面备选；斜光与相机完整保留。
- `009`：封面备选；双手甜品与人物笑脸完整保留。
- 来源平台为用户提供的抖音信息；来源链接、作者身份、公开推广使用情况及高清原始照片尚未补充。
- 原始输入完整保存在 `content/case-templates/_intake/case1`。已迁出 public，网页只保留裁剪后的展示图片。
- 模板 status=ready 只表示资料与衍生图已整理，可进入接入审查；generationReady=false、tested=false，未绑定线上生成模板。

## 复核预览

- [输出检查表 1](../_review/case1-outputs-1.jpg)
- [输出检查表 2](../_review/case1-outputs-2.jpg)

下一步：补齐参考图等资料，另行接入页面或进行已授权的模型测试。
