export type ArtStyle = {
  slug: string;
  name: string;
  category: string;
  description: string;
  detail: string;
  accent: string;
};

/** Public, presentation-only style metadata. No generation prompts live here. */
export const artStyles: readonly ArtStyle[] = [
  {
    slug: "oil-painting",
    name: "Oil painting",
    category: "Classic",
    description: "Depth, texture, and a painterly finish.",
    detail:
      "Rich color and expressive brushwork give portraits and everyday scenes the feel of a painted keepsake.",
    accent: "amber",
  },
  {
    slug: "watercolor",
    name: "Watercolor",
    category: "Soft & airy",
    description: "Light washes and delicate detail.",
    detail:
      "A softer interpretation with flowing pigment, paper texture, and space for the light to breathe.",
    accent: "blue",
  },
  {
    slug: "pencil-sketch",
    name: "Pencil sketch",
    category: "Hand drawn",
    description: "A quiet study in line and shade.",
    detail:
      "Turn a moment into a drawing with expressive lines and carefully balanced shading.",
    accent: "stone",
  },
  {
    slug: "storybook",
    name: "Storybook",
    category: "Illustrated",
    description: "Warm, imaginative illustration.",
    detail:
      "A gentle, original illustrated look for portraits, pets, and scenes worth remembering.",
    accent: "rose",
  },
  {
    slug: "vintage-poster",
    name: "Vintage poster",
    category: "Graphic",
    description: "Bold shapes and nostalgic color.",
    detail:
      "A graphic composition inspired by the warmth and texture of printed posters.",
    accent: "coral",
  },
  {
    slug: "clay-portrait",
    name: "Clay portrait",
    category: "Sculptural",
    description: "Tactile and full of character.",
    detail:
      "A sculptural interpretation that brings handcrafted texture and gentle dimension to a photo.",
    accent: "cocoa",
  },
] as const;

export function getArtStyle(slug: string) {
  return artStyles.find((style) => style.slug === slug);
}
