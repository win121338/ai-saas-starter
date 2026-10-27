import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

// Windows shares loaded DLLs within a process. Separate child processes are
// essential: importing the app's sharp first in Vitest hid this regression.
const probe = `
const { createRequire } = require("node:module");
const nextRequire = createRequire(require.resolve("next/package.json"));
(async () => {
  let appSharp;
  let nextSharp;
  if (process.argv[1] === "next-first") {
    nextSharp = nextRequire("sharp");
    appSharp = require("sharp");
  } else {
    appSharp = require("sharp");
    nextSharp = nextRequire("sharp");
  }
  const bytes = await appSharp({
    create: { width: 8, height: 6, channels: 3, background: "#6699aa" }
  }).webp().toBuffer();
  const metadata = await nextSharp(bytes).metadata();
  process.stdout.write(JSON.stringify({
    sameModule: require.resolve("sharp") === nextRequire.resolve("sharp"),
    sameVersion: appSharp.versions.sharp === nextSharp.versions.sharp,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format
  }));
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
`;

describe("shared sharp native runtime", () => {
  it.each(["next-first", "app-first"])(
    "processes images when loaded in %s order",
    (order) => {
      const output = execFileSync(process.execPath, ["-e", probe, order], {
        cwd: process.cwd(),
        encoding: "utf8",
        timeout: 15_000,
        windowsHide: true,
      });
      expect(JSON.parse(output)).toEqual({
        sameModule: true,
        sameVersion: true,
        width: 8,
        height: 6,
        format: "webp",
      });
    },
  );
});
