import type { Locale } from "@/lib/i18n";
import type { CaseArtwork } from "@/lib/cases/types";

export function filterCaseArtworks(
  items: CaseArtwork[],
  templateId: string,
  query: string,
  locale: Locale,
) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (templateId !== "all" && item.templateId !== templateId) return false;
    const translatedTags: Record<string, string> = {
      pet: "宠物",
      portrait: "人物 人像",
      "daily-life": "日常",
      poster: "海报",
      comic: "漫画",
      marker: "马克笔",
      doodle: "涂鸦",
      travel: "旅行",
    };
    const searchable = [
      item.title[locale],
      item.title.en,
      item.title.zh,
      item.templateName.en,
      item.templateName.zh,
      item.alt.en,
      item.alt.zh,
      ...item.tags,
      ...item.tags.map((tag) => translatedTags[tag] ?? ""),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return words.every((word) => searchable.includes(word));
  });
}
