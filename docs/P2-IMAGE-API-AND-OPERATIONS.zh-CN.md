# P2 图转图：API 备选与接入运行说明

更新：2026-10-22。价格和模型版本会变，签约或定价前应重新核对官方页面，并用同一批照片与提示词实测。

## API 候选

| 候选                                                                               | 适合做什么                                             | 接入与费用要点                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [fal FLUX.1 Kontext pro](https://fal.ai/models/fal-ai/flux-pro/kontext)            | 单图风格转换与主体一致性测试；本项目当前已写入该适配器 | 官方页面当前标价 **$0.04/次编辑**。队列提交、状态查询、结果获取有独立接口；支持 Base64 数据 URI，原图无需公开。见 [API 文档](https://fal.ai/models/fal-ai/flux-pro/kontext/api)。                                              |
| [Google Gemini 图像模型](https://ai.google.dev/gemini-api/docs/models)             | 测试 Nano Banana 2.1 / Flash Lite 的风格效果与速度     | 官方 [价格页](https://ai.google.dev/gemini-api/docs/pricing)按模型、token、分辨率计算。Flash Lite 1K 输出示例约 **$0.0336/张**，另计输入；先核对当前模型可用区域。                                                             |
| [OpenAI GPT Image](https://developers.openai.com/api/docs/guides/image-generation) | 需要精确编辑、多参考图、掩码或多轮修改                 | [Images Edits API](https://developers.openai.com/api/reference/resources/images/methods/edit)接收原图和提示词。当前 GPT Image 2.5 Sunburst/Flare 按输入、输出 token 计费；每图总价与质量和尺寸有关。部分账户可能需要组织验证。 |
| [Replicate](https://replicate.com/docs/topics/predictions/create-a-prediction)     | 快速试多个社区/官方模型                                | 异步预测返回 ID，支持 [webhook](https://replicate.com/docs/topics/webhooks/)；具体价格、速度和图转图参数随模型变化。适合模型筛选，不宜在未固定模型前承诺统一效果。                                                             |

建议先用 **fal Kontext pro** 验证首批 20–30 张真实用户场景，再拿同一批照片、私有提示词和评分维度对比 Google / OpenAI。比较时记录：人物特征保留、风格辨识度、失败率、耗时、实际每图成本和使用条款。示例图与正式提示词由站长后续单独配置。

## 当前实现

- 工作台接受单张 JPEG/PNG/WebP，最大 10 MB、30 MP；服务器统一旋转、缩放到 2048 像素内并编码 WebP，去掉 EXIF 等原始元数据。
- 原图与结果保存在私有目录（本地）或 **Vercel Blob 私有 store**（线上）。只有登录的所有者能通过 `/api/art-assets/[id]` 读取和下载。
- `art_jobs` 持久化任务；同一用户的 `requestKey` 唯一，积分流水以任务 ID 做幂等扣费、退款。提供作品列表、任务状态、前后对比、下载和删除。
- 本地默认 `ART_PROVIDER=mock`，结果上有 `LOCAL DEMO · NOT AI ART`，用于验证流程，**不是实际 AI 生成**。临时风格提示词位于服务端 `src/lib/art/prompts.ts`，上线前须换成经过实测的版本。
- `ART_PROVIDER=fal` 调用 fal 队列。提交成功保存 request ID；任务处理器轮询并把结果复制到私有存储。提交结果不明时标记 `needs_reconciliation`，不盲目重试/退款以避免重复付费或重复扣费。

## 本地测试与接入 fal

1. `pnpm db:migrate` 应用 P2 的 `0004` 迁移。当前本地开发数据库已应用。
2. 保持 `.env` 中 `ART_PROVIDER=mock`（可不填，默认 mock），运行 `pnpm dev`。注册用户后到 `/generate` 上传照片，查看 `/creations`；模拟模式也使用原 starter 的 **1 积分/次**，失败会退款。
3. 在 [fal 登录页](https://fal.ai/login)用 GitHub、Google 或 Microsoft 注册；在 [API Keys](https://fal.ai/dashboard/keys) 创建用于 API 调用的 key。依据 [fal 服务条款](https://fal.ai/legal/terms-of-service)，使用服务需预购 credits；在 [Billing](https://fal.ai/dashboard/usage-billing/billing) 查看余额并充值。注册免费，但不要假设新账号一定有可用赠送额度。
4. 在本地运行 `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\configure-fal.ps1`，在隐藏输入框粘贴 key。脚本只写被 Git 忽略的 `.env`，设置 `ART_PROVIDER=fal`。用同一命令加 `-Status` 可检查是否配置，**不会显示 key**。不要把 key 发到聊天或提交到 Git。确保账户已有测试余额；第一张真实生成会产生 API 费用。
5. 设置长度至少 32 位的 `ART_WORKER_SECRET`，让可信任务调度器以 `POST /api/internal/art-worker`、`Authorization: Bearer <ART_WORKER_SECRET>` 每 20–30 秒调用一次。每次处理最多 5 个任务并执行补偿/清理。开发模式的提交动作也会尝试后台处理一次，但持久恢复依赖这个定时调用。
6. 线上必须使用 **Vercel Blob 私有 store** 的 `BLOB_READ_WRITE_TOKEN`。普通公开 Blob store 不适合用户原图。生产环境校验要求 fal、私有 Blob 和 worker secret 全部配置。

原模板的 `/generate/text-demo` 仍是开发演示，使用公开 Blob 写入方式；它与 P2 的私有 Blob token 不兼容。正式部署前应关闭该演示入口，或单独为它设计私有存储与鉴权，不能把用户照片转存到公开容器。

建议上线前专门验证异常：fal 超时、返回失败、worker 重启、网络断开、重复点击、账户删除，以及各种大小/格式的图片。`needs_reconciliation` 表示供应商提交是否成功不明，应先在 fal 后台按时间和用户关联核对，再决定补记 request ID、恢复轮询或退款。不要自动再次提交。

## 数据与商业参数

任务结束后原图最多保留约 24 小时，结果最多保留 30 天；用户删除后的文件由下一次 worker 清理。尚处于处理或待核对状态的原图不会过期删除。第三方供应商自己的留存政策还需要单独核查。

项目仍沿用 starter 的 `GENERATION_COST_CREDITS=1` 和旧订阅档位。这只是流程测试参数，**不能直接用来出售 fal 生成**：例如每张 $0.04 时，200 张供应商成本就约 $8，还没计算支付手续费、存储、退款、失败重试和税费。正式开通付费前，需先确定供应商、真实成本、积分档位和价格，再修改 `src/config/plans.ts` 并更新页面文案。
