import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/"))
      return {
        url: pathToFileURL(path.resolve("src", `${specifier.slice(2)}.ts`))
          .href,
        shortCircuit: true,
      };
    return nextResolve(specifier, context);
  },
});
const { creativeDefinition, creativeId } =
  await import("../src/lib/creative/schema.ts");

// Node 22.18+ can strip this schema's erasable TypeScript without another tool.
const root = path.resolve("content/case-templates");
const check = process.argv.includes("--check");
const ids = process.argv.slice(2).filter((arg) => arg !== "--check");
if (!ids.length)
  throw new Error(
    "Provide one or more template IDs, optionally followed by --check.",
  );

for (const raw of ids) {
  const id = creativeId.parse(raw);
  const directory = path.join(root, id);
  const read = async (name) =>
    JSON.parse(await readFile(path.join(directory, name), "utf8"));
  if (check) {
    creativeDefinition.parse(await read("creative-template.json"));
    process.stdout.write(`${id}: package valid\n`);
    continue;
  }
  const manifest = await read("template.json");
  if (manifest.id !== id || manifest.displayPermission !== "confirmed")
    throw new Error(`${id}: review the ID and display permission first.`);
  const recipe = await read(`generation-v${manifest.prompt.version}.json`);
  let previous;
  try {
    previous = await read("creative-template.json");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const image = (art, kind) =>
    art.assets[kind]
      ? {
          src: art.assets[kind],
          width: art.assetSizes[kind][0],
          height: art.assetSizes[kind][1],
        }
      : null;
  const definition = creativeDefinition.parse({
    schemaVersion: 1,
    id,
    name: manifest.name,
    summary: manifest.summary,
    suitability: previous?.suitability ?? manifest.summary,
    tags: manifest.tags,
    coverCaseId: manifest.coverCaseId,
    featuredCaseIds: manifest.featuredCaseIds,
    recipe,
    cases: manifest.cases
      .filter((art) => art.review === "passed")
      .map((art) => ({
        id: art.id,
        title: { zh: art.title, en: art.titleEn },
        alt: art.alt,
        before: image(art, "before"),
        after: image(art, "after"),
        thumbnail: image(art, "thumb"),
        tags: [...manifest.tags, ...art.subjectTags],
        provenance: manifest.provenance,
      })),
  });
  await writeFile(
    path.join(directory, "creative-template.json"),
    `${JSON.stringify(definition, null, 2)}\n`,
  );
  process.stdout.write(
    `${id}: local package prepared; review suitability before importing\n`,
  );
}
