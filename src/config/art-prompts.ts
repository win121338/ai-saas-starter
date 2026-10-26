/**
 * Built-in image-generation prompt defaults and historical versions.
 * Keep old versions intact: queued jobs store styleVersion and must use the
 * same recipe they were created with. Operations can publish newer immutable
 * versions in the database; do not change these historical versions.
 */
export const ART_PROMPT_VERSION = 3;
export const ART_PROMPT_MAX_LENGTH = 2_000;

type PromptRecipe = {
  prefix: string;
  styles: Record<string, string>;
  suffix: string;
  rules?: Record<string, string>;
};

export const ART_PROMPT_RECIPES: Record<number, PromptRecipe> = {
  // Historical jobs created with the original P2 prompt.
  1: {
    prefix: "Transform the supplied photo into ",
    styles: {
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
    },
    suffix:
      ". Preserve the main subject's identity, composition, pose, and recognizable features. Make a finished original artwork. No text, logos, watermark, or frame.",
  },
  // Active recipes. Make the chosen medium unmistakable across the whole image.
  2: {
    prefix:
      "Use the supplied photo as the visual reference. Recreate the entire image as ",
    styles: {
      "oil-painting":
        "a traditional oil painting on canvas. Use visible layered brushstrokes, expressive impasto in focal areas, blended painted shadows, and rich but natural color. Render the background and every subject as paint rather than leaving photographic regions",
      watercolor:
        "a traditional watercolor on cold-press paper. Use translucent washes, soft pigment blooms, delicate wet-on-wet edges, and reserved paper highlights. Keep the overall image airy; avoid thick paint, glossy surfaces, and photographic detail",
      "pencil-sketch":
        "a hand-drawn graphite pencil sketch on textured white paper. Build form with varied line weight, fine hatching, and soft graphite shading. Use a monochrome graphite palette throughout; avoid color fills and photographic surfaces",
      storybook:
        "an original hand-painted storybook illustration. Use simplified but recognizable shapes, warm expressive colors, gentle outlines, and subtle paper texture. Give every part of the scene a coherent illustrated finish; avoid photorealistic skin or backgrounds",
      "vintage-poster":
        "a vintage screen-printed poster illustration with bold simplified silhouettes, a restrained retro color palette, flat color blocks, and subtle aged-print texture. Keep the subject recognizable while making the entire scene graphic rather than photographic; do not add poster lettering",
      "clay-portrait":
        "a handcrafted clay sculpture scene photographed under soft studio light. Turn the people, animals, and important objects into rounded matte clay forms with subtle hand-shaped texture and dimensional shadows. Keep distinctive faces, hair, clothing, and markings recognizable; avoid realistic skin or painted flat areas",
    },
    suffix:
      ". Keep the same main subjects, their count, pose, defining features, and recognizable scene layout from the photo while changing the visual medium. Do not add unrelated people or objects. Deliver one finished artwork with no text, logo, watermark, border, or frame.",
  },
  // Active editable presets. Rules stay fixed when a user edits the preset.
  3: {
    prefix: "Use the uploaded photo as the visual reference. Create ",
    styles: {
      "oil-painting":
        "a traditional oil painting with rich natural color, visible layered brushwork, and canvas texture throughout the scene",
      watercolor:
        "a light watercolor painting with translucent washes, soft pigment blooms, and cold-press paper texture throughout the scene",
      "pencil-sketch":
        "a monochrome graphite drawing with varied pencil lines, fine hatching, gentle shading, and textured paper throughout the scene",
      storybook:
        "an original hand-painted storybook illustration with simplified but recognizable shapes, warm colors, gentle outlines, and subtle paper texture",
      "vintage-poster":
        "a vintage screen-printed poster illustration with bold simplified silhouettes, flat color blocks, a limited retro palette, and print grain",
      "clay-portrait":
        "a handcrafted clay sculpture scene with rounded matte forms, subtle hand-shaped texture, dimensional shadows, and soft studio lighting",
    },
    suffix:
      ". Preserve the main subjects, their count, pose, defining features, and recognizable scene layout. Do not add unrelated subjects, text, logos, watermarks, borders, or frames.",
    rules: {
      "oil-painting":
        "STYLE RULE — OIL PAINTING: Keep every subject and background visibly painted with layered oil brushstrokes and canvas texture. Do not switch to photography, watercolor, pencil drawing, flat poster graphics, or clay sculpture.",
      watercolor:
        "STYLE RULE — WATERCOLOR: Keep every subject and background in translucent watercolor washes on textured paper, with soft pigment edges. Avoid opaque oil impasto, flat poster graphics, graphite-only drawing, clay sculpture, and photographic surfaces.",
      "pencil-sketch":
        "STYLE RULE — PENCIL SKETCH: Keep the entire result monochrome graphite on paper, using drawn contours and hatching to describe form. No color painting, photographic rendering, printed poster blocks, or clay sculpture.",
      storybook:
        "STYLE RULE — STORYBOOK: Keep the entire image a coherent hand-painted illustration with simplified forms and drawn edges. Avoid photorealistic regions, poster lettering, graphite-only rendering, and clay sculpture.",
      "vintage-poster":
        "STYLE RULE — VINTAGE POSTER: Keep the entire scene as limited-palette screen-print artwork with bold flat shapes and print texture. No lettering, photorealistic regions, watercolor washes, oil impasto, pencil-only rendering, or clay sculpture.",
      "clay-portrait":
        "STYLE RULE — CLAY PORTRAIT: Make all important subjects visibly three-dimensional matte clay with sculpted texture and soft physical shadows. Avoid photorealistic skin, flat illustration, watercolor, oil painting, graphite sketch, and poster graphics.",
    },
  },
};
