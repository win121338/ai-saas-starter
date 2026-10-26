import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await getLocale()) === "zh" ? "服务条款信息" : "Terms",
    robots: { index: false },
  };
}

export default async function TermsPage() {
  const zh = (await getLocale()) === "zh";
  return (
    <div className="artora-shell flex-1">
      <div className="mx-auto max-w-[800px] px-5 py-20 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {zh ? "上线准备" : "Launch preparation"}
        </p>
        <h1 className="mt-4 font-heading text-4xl font-extrabold">
          {zh ? "服务条款信息" : "Terms information"}
        </h1>
        <div className="artora-surface mt-8 space-y-4 p-7 text-sm leading-7 text-muted-foreground">
          <p>
            {zh
              ? "Artora 目前处于可体验的预览阶段。照片转艺术生成和 Artora 结账功能尚未正式开放。"
              : "Artora is currently a working preview. Photo-to-art generation and Artora checkout are not available yet."}
          </p>
          <p>
            {zh
              ? "正式服务条款会在服务开放前公布，包括运营主体、付款规则、退款政策和内容权利。"
              : "Final service terms, including the operating entity, payment rules, refunds, and content rights, will be published before those services open."}
          </p>
          <p>
            {zh
              ? "源代码项目采用 MIT 许可证。它与未来托管服务的条款分别适用。"
              : "The source project's MIT license applies to its code. It is separate from the terms for a future hosted service."}
          </p>
        </div>
      </div>
    </div>
  );
}
