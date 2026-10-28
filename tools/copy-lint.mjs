#!/usr/bin/env node
// Anti-slop release gate: banned marketing words in UI and listing copy, and
// raw colour values outside the design-token file. Run in CI on every merge.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCAN = ["apps/web/app", "apps/web/components", "apps/web/lib", "packages/core/src"];
const EXT = /\.(tsx?|mdx?|json)$/;

// The blueprint's list, plus stock phrases that mark text as machine-written.
export const BANNED = [
  "dream home", "luxurious", "world-class", "world class", "nestled", "seamless", "unlock", "elevate", "premium lifestyle",
  "delve", "tapestry", "testament", "vibrant", "bustling", "curated", "bespoke", "effortless", "hassle-free", "state-of-the-art",
  "unparalleled", "boasts", "look no further", "whether you're", "in today's", "game-changer", "game changer", "cutting-edge",
  "breathtaking", "stunning", "perfect blend", "embark", "elevated living", "redefine", "unmatched", "next-level",
];
const bannedRe = new RegExp(`\\b(${BANNED.map((w) => w.replace(/[-\s]/g, "[-\\s]")).join("|")})\\w*`, "gi");

// Colours live in globals.css as tokens; everything else references them.
const HEX_ALLOWED = new Set(["apps/web/app/globals.css"]);
const hexRe = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.test(name)) yield p;
  }
}

const problems = [];
for (const base of SCAN) {
  for (const file of walk(join(ROOT, base))) {
    const rel = relative(ROOT, file).split(sep).join("/");
    if (/\.test\.ts$/.test(rel)) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const m of line.matchAll(bannedRe)) problems.push(`${rel}:${i + 1}  banned word "${m[0]}"`);
        if (!HEX_ALLOWED.has(rel)) for (const m of line.matchAll(hexRe)) problems.push(`${rel}:${i + 1}  raw colour ${m[0]}; use a design token`);
        // Spaced em dashes in UI text read as machine-written; use a full stop, comma or colon.
        if (rel.endsWith(".tsx") && / — /.test(line)) problems.push(`${rel}:${i + 1}  em dash in copy; rewrite the sentence`);
      });
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} copy problem(s). See "Anti-slop rules" in the blueprint.`);
  process.exit(1);
}
console.log("copy-lint: clean");
