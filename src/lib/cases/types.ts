import type { Locale } from "@/lib/i18n";

export type CaseText = Record<Locale, string>;

export type CaseImage = {
  src: string;
  width: number;
  height: number;
};

export type CaseArtwork = {
  id: string;
  templateId: string;
  templateName: CaseText;
  title: CaseText;
  alt: CaseText;
  before: CaseImage | null;
  after: CaseImage;
  thumbnail: CaseImage;
  tags: string[];
};

export type CaseTemplate = {
  id: string;
  name: CaseText;
  summary: CaseText;
  tags: string[];
  coverCaseId: string;
  generationStyleSlug: string | null;
  cases: CaseArtwork[];
};

export type CaseCatalog = {
  templates: CaseTemplate[];
  featuredTemplateId: string;
  featured: CaseArtwork[];
};

export function artworkHref(artwork: Pick<CaseArtwork, "templateId" | "id">) {
  return `/styles/${artwork.templateId}/${artwork.id}`;
}

export function templateCover(template: CaseTemplate): CaseArtwork {
  const cover = template.cases.find((item) => item.id === template.coverCaseId);
  if (!cover) throw new Error("Collection cover is missing");
  return cover;
}
