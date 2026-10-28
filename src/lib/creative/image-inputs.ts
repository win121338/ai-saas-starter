/** Stored with the recipe so old jobs keep their original image numbering. */
export type ReferenceInputOrder = "subject-first" | "reference-first";

export function orderedCreativeImages<T>(
  subject: T,
  reference?: T,
  order: ReferenceInputOrder = "reference-first",
): T[] {
  if (reference === undefined) return [subject];
  return order === "subject-first"
    ? [subject, reference]
    : [reference, subject];
}
