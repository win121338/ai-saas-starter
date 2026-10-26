# P2 图转图：API 备选与接入运行说明

更新：2026-10-23。价格和模型版本会变，签约或定价前应重新核对官方页面，并用同一批照片与提示词实测。当前工作台优先使用国内可直接申请的 API：千问默认，Seedream 和万相可切换；fal 和 OpenAI 留待后续。

## 当前可选模型与成本

| 模型                                                                                                            | 图转图调用                                            | 官方北京区域按量参考价                                                                                        | 适用判断                                           |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [Qwen Image 2.1 Turbo](https://help.aliyun.com/zh/model-studio/qwen-image-generation-and-editing-api-reference) | DashScope 异步图像编辑；上传图片 Base64，轮询 task ID | [¥0.10/输出张；10 张试用额度](https://help.aliyun.com/zh/model-studio/model-pricing)                          | 当前默认，作为成本和效果对照                       |
| [Qwen-Image 3.0 Pro](https://help.aliyun.com/zh/model-studio/qwen-image-generation-and-editing-api-reference)   | DashScope 异步图像编辑；单图输入、单图输出            | [图片输入 ¥0.02；1K 输出 ¥0.25、2K 输出 ¥0.50/张](https://help.aliyun.com/zh/model-studio/qwen-image-3-0-pro) | 对照细节、人物相似度和真实质感；当前不强制输出尺寸 |
| [Wan 2.7 Image Pro](https://help.aliyun.com/zh/model-studio/wan-image-generation-and-editing-api-reference)     | 百炼 2.7 异步编辑接口；单图输入、2K 单图输出          | [¥0.50/成功输出张；北京地域 50 张新人额度](https://help.aliyun.com/zh/model-studio/model-pricing)             | 对照旗舰版编辑效果与主体一致性                     |
| [Wan 2.7 Image](https://help.aliyun.com/zh/model-studio/wan-image-generation-and-editing-api-reference)         | 与 Pro 相同接口；单图输入、2K 单图输出                | [¥0.20/成功输出张；北京地域 50 张新人额度](https://help.aliyun.com/zh/model-studio/model-pricing)             | 对照生成速度与性价比                               |
| [Seedream 5.0 Flash](https://console.volcengine.com/ark/region:cn-beijing/docs/image-generation-api)            | 火山方舟单图编辑；以 Base64 返回私有结果              | [¥0.12/输出张](https://console.volcengine.com/ark/region:cn-beijing/docs/model-pricing)                       | 对照不同供应商的风格效果                           |

千问、万相按任务完成后实际输出计费；火山方舟文档写明审核等原因未成功输出不计费。站内当前仍统一扣 **1 个测试积分/次**，不代表将来的销售定价。两家图片处理节点目前均配置在北京；国际市场上线前，应核对用户数据跨境处理、服务商协议和正式隐私政策。

可继续试：[Seedream 5.0 Pro](https://console.volcengine.com/ark/region:cn-beijing/docs/image-generation-api) 可做更高质量对照，官方 [1.5K 及以下 ¥0.30/张](https://console.volcengine.com/ark/region:cn-beijing/docs/model-pricing)；[腾讯混元生图](https://cloud.tencent.com/product/aiart) 也支持单图生图，旧平台官方 [后付费 ¥0.50/张、首次开通 50 次试用](https://cloud.tencent.com/document/product/1729/105925)，且能力正迁往 TokenHub，暂列低优先级。

## API 候选

| 候选                                                                               | 适合做什么                                             | 接入与费用要点                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [fal FLUX.1 Kontext pro](https://fal.ai/models/fal-ai/flux-pro/kontext)            | 单图风格转换与主体一致性测试；本项目当前已写入该适配器 | 官方页面当前标价 **$0.04/次编辑**。队列提交、状态查询、结果获取有独立接口；支持 Base64 数据 URI，原图无需公开。见 [API 文档](https://fal.ai/models/fal-ai/flux-pro/kontext/api)。                                              |
| [Google Gemini 图像模型](https://ai.google.dev/gemini-api/docs/models)             | 测试 Nano Banana 2.1 / Flash Lite 的风格效果与速度     | 官方 [价格页](https://ai.google.dev/gemini-api/docs/pricing)按模型、token、分辨率计算。Flash Lite 1K 输出示例约 **$0.0336/张**，另计输入；先核对当前模型可用区域。                                                             |
| [OpenAI GPT Image](https://developers.openai.com/api/docs/guides/image-generation) | 需要精确编辑、多参考图、掩码或多轮修改                 | [Images Edits API](https://developers.openai.com/api/reference/resources/images/methods/edit)接收原图和提示词。当前 GPT Image 2.5 Sunburst/Flare 按输入、输出 token 计费；每图总价与质量和尺寸有关。部分账户可能需要组织验证。 |
| [Replicate](https://replicate.com/docs/topics/predictions/create-a-prediction)     | 快速试多个社区/官方模型                                | 异步预测返回 ID，支持 [webhook](https://replicate.com/docs/topics/webhooks/)；具体价格、速度和图转图参数随模型变化。适合模型筛选，不宜在未固定模型前承诺统一效果。                                                             |

建议先拿同一批 20–30 张照片与私有提示词比较千问、万相和 Seedream，记录人物特征保留、风格辨识度、失败率、耗时、实际每图成本和使用条款。示例图与正式提示词由站长后续单独配置。海外平台留待可以正常开通支付后再做同样的盲评。

## 当前实现

- 工作台接受单张 JPEG/PNG/WebP，最大 10 MB、30 MP；服务器统一旋转、缩放到 2048 像素内并编码 WebP，去掉 EXIF 等原始元数据。
- 原图与结果保存在私有目录（本地）或 **Vercel Blob 私有 store**（线上）。只有登录的所有者能通过 `/api/art-assets/[id]` 读取和下载。
- `art_jobs` 持久化任务；同一用户的 `requestKey` 唯一，积分流水以任务 ID 做幂等扣费、退款。提供作品列表、任务状态、前后对比、下载和删除。
- 本地默认 `ART_PROVIDER=mock`，结果上有 `LOCAL DEMO · NOT AI ART`，用于验证流程，**不是实际 AI 生成**。真实生成时，默认取内置提示词或后台已发布的新版本；用户可在工作台按单次任务修改，提交的修改优先于预设。
- `ART_PROVIDER=live` 时，下拉框展示千问、万相与 Seedream；未配置密钥的选项不可提交。万相要求处理后的图片宽高均至少 240 像素，尺寸不符时提交前提示，不扣积分。千问与万相保存 task ID 并轮询，Seedream 直接接收 Base64 结果。供应商明确返回 429 时，任务延迟 30 秒后重新排队；持续超过一天则失败退款。提交结果不明时标记 `needs_reconciliation`，不盲目重试/退款以避免重复付费或重复扣费。
- fal 适配器保留在代码中，但当前未列入工作台下拉框。

### 风格提示词维护

内置及历史提示词放在 `src/config/art-prompts.ts`；新的运营版本由 `/admin/templates` 发布到数据库。内置 `styles` 的键必须和 `src/config/art-styles.ts` 的风格 `slug` 一一对应。未发布后台模板的风格使用内置版本 3；后台每次发布都会为该风格生成不可变的新版本，包含默认可编辑提示词和固定风格边界。用户修改的提示词按单次任务保存，优先于默认值；所选风格规则始终追加到最终请求，避免生成结果偏离所选画材或表现形式。切换风格时，未修改的文本跟随新风格预设，已修改的文本保持原样，用户可点击“恢复风格预设”。最终发送内容可在非模拟任务的作品详情页查看。

日常调整请使用后台发布新版本，不要编辑内置历史版本：已排队的任务和重试会使用创建时记录的 `styleVersion` 与用户修改。旧任务不会追溯套用新规则。规则属于模型指令，不是图像识别或硬性内容校验；不同模型的遵循程度仍需用同一批照片实测。

## 本地测试与接入国内模型

1. `pnpm db:migrate` 应用 P2 的 `0004`、提示词覆盖字段的 `0005` 与运营后台的 `0006` 迁移。当前本地开发数据库已应用。
2. 保持 `.env` 中 `ART_PROVIDER=mock`（可不填，默认 mock），运行 `pnpm dev`。注册用户后到 `/generate` 上传照片，查看 `/creations`；模拟模式也使用原 starter 的 **1 积分/次**，失败会退款。
3. 在 [阿里云百炼](https://help.aliyun.com/zh/model-studio/get-api-key)和[火山方舟](https://console.volcengine.com/ark/region:cn-beijing/docs/quick-start)开通相应模型服务，获取北京区域 API Key。确保账号有可用试用额度或计费余额。
4. 在被 Git 忽略的 `.env` 中设置 `ART_PROVIDER=live`、`DASHSCOPE_API_KEY`、`ARK_API_KEY`。只填某一家时，工作台只允许选已配置的模型。万相与千问复用同一把北京地域的百炼通用 Key，但请求格式和路径各按对应模型文档发送。默认使用北京共享域名；准备对外运营时，建议配置 `DASHSCOPE_WORKSPACE_ID` 改用业务空间专属域名。万相新人免费额度以百炼控制台实际余额和有效期为准；不需要另建 Key。不要把密钥发到聊天或提交到 Git。当前本机 `.env` 已依据用户提供的密钥文件配置；代码和文档不包含密钥。
5. 设置长度至少 32 位的 `ART_WORKER_SECRET`，让可信任务调度器以 `POST /api/internal/art-worker`、`Authorization: Bearer <ART_WORKER_SECRET>` 每 20–30 秒调用一次。每次处理最多 5 个任务并执行补偿/清理。开发模式会在提交后后台处理一次，并短时轮询千问或万相结果；登录用户保持作品详情页打开时，也会按原任务 ID 继续查询。关闭页面或重启后的持久恢复仍依赖定时调用，生产环境不能只靠页面轮询。
6. 线上必须使用 **Vercel Blob 私有 store** 的 `BLOB_READ_WRITE_TOKEN`。普通公开 Blob store 不适合用户原图。生产环境校验要求至少一个真实模型密钥、私有 Blob 和 worker secret 全部配置。

原模板的 `/generate/text-demo` 仍是开发演示，使用公开 Blob 写入方式；它与 P2 的私有 Blob token 不兼容。正式部署前应关闭该演示入口，或单独为它设计私有存储与鉴权，不能把用户照片转存到公开容器。

建议上线前专门验证异常：供应商超时、返回失败、worker 重启、网络断开、重复点击、账户删除，以及各种大小/格式的图片。`needs_reconciliation` 表示供应商结果不明，应先在百炼或方舟后台核对，再决定恢复轮询或退款。不要自动再次提交。当前测试已覆盖模拟 API 和测试数据库；还未触发真实付费图片生成。

## 数据与商业参数

任务结束后原图最多保留约 24 小时，结果最多保留 30 天；用户删除后的文件由下一次 worker 清理。尚处于处理或待核对状态的原图不会过期删除。第三方供应商自己的留存政策还需要单独核查。

项目仍沿用 starter 的 `GENERATION_COST_CREDITS=1` 和旧订阅档位。这只是流程测试参数，**不能直接作为正式销售价格**。正式开通付费前，需依据真实生成成本、支付手续费、存储、退款和税费确认积分档位，再经用户同意修改 `src/config/plans.ts` 并更新页面文案。
