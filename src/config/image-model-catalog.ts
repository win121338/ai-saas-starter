export const artModels = [
  {
    id: "qwen-image-2.1-turbo",
    provider: "qwen",
    label: "Qwen Image 2.1 Turbo",
    description: "Balanced quality and value",
  },
  {
    id: "qwen-image-3.0-pro",
    provider: "qwen",
    label: "Qwen-Image 3.0 Pro",
    description: "Detailed image edits and realistic texture",
  },
  {
    id: "wan2.7-image-pro",
    provider: "wanx",
    label: "Wan 2.7 Image Pro",
    description: "Flagship image editing and subject consistency",
  },
  {
    id: "wan2.7-image",
    provider: "wanx",
    label: "Wan 2.7 Image",
    description: "Faster image editing for comparison",
  },
  {
    id: "doubao-seedream-5-0-flash-260915",
    provider: "seedream",
    label: "Seedream 5.0 Flash",
    description: "Fast image editing",
  },
] as const;

export const DEFAULT_ART_MODEL = artModels[0].id;

export function getArtModel(id: string) {
  return artModels.find((model) => model.id === id);
}
