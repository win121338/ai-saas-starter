import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getLocale()) === "zh" ? "隐私信息" : "Privacy",
    robots: { index: false },
  };
}

export default async function PrivacyPage() {
  const zh = (await getLocale()) === "zh";
  return (
    <div className="artora-shell flex-1">
      <div className="mx-auto max-w-[800px] px-5 py-20 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {zh ? "上线准备" : "Launch preparation"}
        </p>
        <h1 className="mt-4 font-heading text-4xl font-extrabold">
          {zh ? "隐私信息" : "Privacy information"}
        </h1>
        <div className="artora-surface mt-8 space-y-4 p-7 text-sm leading-7 text-muted-foreground">
          <p>
            {zh
              ? "创建作品时，你选择的照片会上传至服务器，调整尺寸、转换为 WebP，并移除图片内嵌元数据。原图和生成结果会私密存储，只有登录账户后才能查看。"
              : "When you create artwork, your selected photo is uploaded to the server, resized, converted to WebP, and stripped of embedded image metadata. The original and result are stored privately and can be viewed only through your signed-in account."}
          </p>
          <p>
            {zh
              ? "注册账户时，项目的身份验证系统会保存登录所需的账户信息。独立的旧版文生图演示沿用模板现有的生成和积分记录。照片转艺术任务还会记录所选风格、任务状态，以及积分扣除或退还情况。"
              : "Account registration uses the project's authentication system and stores the account information needed to sign in. The separate legacy text-to-image demo uses the starter's existing generation and credit records. Photo-to-art jobs also record the chosen style, status, and credit spend or refund."}
          </p>
          <p>
            {zh
              ? "本地演示模式不会将图片发送给模型服务。使用真实模型时，处理后的照片和风格指令会发送给你选择的阿里云百炼千问、火山方舟 Seedream，或在启用旧版配置时发送给 fal。国内模型在中国大陆处理。请不要上传无权使用或不愿交由该服务商处理的照片。"
              : "Local demo mode does not send photos to a model provider. For live generation, the processed photo and style instruction are sent to your selected Qwen model on Alibaba Cloud Model Studio, Seedream model on Volcengine Ark, or fal when its legacy mode is enabled. The domestic models process data in mainland China. Upload only photos you may share with that provider."}
          </p>
          <p>
            {zh
              ? "任务完成后，输入图片计划在 24 小时内删除；结果最多保留 30 天。等待核对的任务文件可能需要保留更久，以便确认结果。你可以在账户中删除已完成的作品。删除账户也会移除其存储的照片转艺术文件。"
              : "After a job finishes, its input is scheduled for deletion within 24 hours; the result is retained for up to 30 days. Files for a job awaiting reconciliation may be kept longer so its outcome can be resolved. You can delete a completed creation from your account. Account deletion removes its stored photo-to-art files."}
          </p>
          <p>
            {zh
              ? "此上线前说明会在公开服务开放前由正式隐私政策替换。"
              : "This pre-launch notice will be replaced with the final privacy policy before the public service opens."}
          </p>
        </div>
      </div>
    </div>
  );
}
