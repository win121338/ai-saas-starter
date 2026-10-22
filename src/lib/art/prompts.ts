import "server-only";

import { getArtStyle } from "@/config/art-styles";

// Temporary P2 prompts. Replace with owner-tested, versioned recipes before launch.
const directions: Record<string, string> = {
  "oil-painting":
    "an expressive oil painting with visible brush strokes and rich, layered color",
  watercolor:
    "a delicate watercolor painting with translucent pigment and natural paper texture",
  "pencil-sketch":
    "a fine pencil illustration with intentional line work and gentle shading",
  storybook:
    "an original, warm storybook illustration with hand-painted detail",
  "vintage-poster":
    "a vintage print illustration with restrained color and tactile print texture",
  "clay-portrait":
    "a handcrafted clay sculpture portrait with soft studio lighting and tactile detail",
};

export const ART_PROMPT_VERSION = 1;

export function artPrompt(slug: string): string {
  if (!getArtStyle(slug) || !directions[slug])
    throw new Error("Unknown art style");
  return `Transform the supplied photo into ${directions[slug]}. Preserve the main subject's identity, composition, pose, and recognizable features. Make a finished original artwork. No text, logos, watermark, or frame.`;
}
