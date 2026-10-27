# 闯进漫画这一格 · 素材整理报告

日期：2026-10-26

本次范围：最初收到的 `public/cases/case2`，完成规范阶段 A–C。原始输入现位于 `content/case-templates/_intake/case2`。

处理数量：8 张输入，8 组完成，0 组待裁剪复核，0 组排除；共 32 张衍生图。

输出位置：`public/cases/color-block-manga/`。原件副本位于本目录 `originals/`，原始 `p.md` 已按原字节复制。

## 导出规格与核验

- 原截图：1206×2622。每张成品：1206×1206。每张对比图：1206×1608。缩略图：640×640。
- 成品裁剪框 `[0, 785, 1206, 1206]`；对比裁剪框 `[0, 383, 1206, 1608]`。所有截图均独立检查后确认共享这两个边界。
- 原照宽度逐张测量，坐标见下表与 template.json；没有用统一宽度批裁。
- before、after、compare 使用无损 WebP，解码像素与源截图对应区域完全一致；thumb 使用质量 90 的 WebP。
- 所有原件及提示词副本通过 SHA-256 核对，25 张源图跨组未发现字节完全相同的重复文件。
- 原照、成品、对比图、缩略图已通过逐图联系表视觉检查；程序另验证解码、尺寸、裁剪像素、缩略图误差与文件哈希。
- 检查通过指素材导出正确；未运行生成模型，未验证提示词复现率。

源图大小：13.04 MiB；衍生图合计：15.42 MiB。

## 封面推荐

首选：`002`。珊瑚红背景与深绿棕榈叶在缩略图中醒目，黑白人物、帽子与书本关系清楚。

- 备选 `001`：蓝底粉色网格与黑白自拍形成强反差，人物表情突出。
- 备选 `008`：蓝天与绿色山景明快，展示旅行照片的转换方向。

## 逐图记录

| 案例 | 原照裁剪框 x,y,w,h | 成品 | 对比 | 缩略图 | 检查 |
| --- | --- | --- | --- | --- | --- |
| 001 · 网格里的自拍 | `[402, 383, 402, 402]` | [成品](../../../public/cases/color-block-manga/001-after.webp) | [对比](../../../public/cases/color-block-manga/001-compare.webp) | [缩略图](../../../public/cases/color-block-manga/001-thumb.webp) | 通过 |
| 002 · 棕榈与红色假日 | `[402, 383, 402, 402]` | [成品](../../../public/cases/color-block-manga/002-after.webp) | [对比](../../../public/cases/color-block-manga/002-compare.webp) | [缩略图](../../../public/cases/color-block-manga/002-thumb.webp) | 通过 |
| 003 · 回头这一格 | `[420, 383, 381, 402]` | [成品](../../../public/cases/color-block-manga/003-after.webp) | [对比](../../../public/cases/color-block-manga/003-compare.webp) | [缩略图](../../../public/cases/color-block-manga/003-thumb.webp) | 通过 |
| 004 · 窗边的小表情 | `[406, 383, 402, 402]` | [成品](../../../public/cases/color-block-manga/004-after.webp) | [对比](../../../public/cases/color-block-manga/004-compare.webp) | [缩略图](../../../public/cases/color-block-manga/004-thumb.webp) | 通过 |
| 005 · 绿椅上的停顿 | `[392, 383, 405, 402]` | [成品](../../../public/cases/color-block-manga/005-after.webp) | [对比](../../../public/cases/color-block-manga/005-compare.webp) | [缩略图](../../../public/cases/color-block-manga/005-thumb.webp) | 通过 |
| 006 · 午后长椅 | `[410, 383, 385, 402]` | [成品](../../../public/cases/color-block-manga/006-after.webp) | [对比](../../../public/cases/color-block-manga/006-compare.webp) | [缩略图](../../../public/cases/color-block-manga/006-thumb.webp) | 通过 |
| 007 · 晴空台阶 | `[436, 383, 334, 402]` | [成品](../../../public/cases/color-block-manga/007-after.webp) | [对比](../../../public/cases/color-block-manga/007-compare.webp) | [缩略图](../../../public/cases/color-block-manga/007-thumb.webp) | 通过 |
| 008 · 山风回眸 | `[389, 383, 404, 402]` | [成品](../../../public/cases/color-block-manga/008-after.webp) | [对比](../../../public/cases/color-block-manga/008-compare.webp) | [缩略图](../../../public/cases/color-block-manga/008-thumb.webp) | 通过 |

## 已知差异与待补充

- 主风格参考图未提供，无法确认完整复现条件。
- 部分参考背景存在纹理或层次，与提示词的纯平色约束不完全一致。
- 多人、宠物以及复杂遮挡场景待验证。
- `001`：封面备选；网格背景与手机边界完整保留。
- `002`：封面首选；红色棕榈背景和手持书本均来自原截图，未重绘或移入其他图片。
- `008`：封面备选；长发与山景留在原方图画幅内。
- 来源平台为用户提供的抖音信息；来源链接、作者身份、公开推广使用情况及高清原始照片尚未补充。
- 原始输入完整保存在 `content/case-templates/_intake/case2`。已迁出 public，网页只保留裁剪后的展示图片。
- 模板 status=ready 只表示资料与衍生图已整理，可进入接入审查；generationReady=false、tested=false，未绑定线上生成模板。

## 复核预览

- [输出检查表 1](../_review/case2-outputs-1.jpg)
- [输出检查表 2](../_review/case2-outputs-2.jpg)

下一步：补齐参考图等资料，另行接入页面或进行已授权的模型测试。
