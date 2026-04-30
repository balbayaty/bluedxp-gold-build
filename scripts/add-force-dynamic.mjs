// Bulk-add `export const dynamic = 'force-dynamic'` to all API routes
// that don't already declare a `dynamic` export.
//
// Why:  Next.js attempts static generation by default. Routes that read
//       cookies/headers/searchParams throw DYNAMIC_SERVER_USAGE during
//       page-data collection, failing the production build.
//
// What: Idempotent. Skips files that already contain a `dynamic` export.
//       Inserts the directive AFTER the last top-level import / "use ..."
//       directive, preserving file structure.

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join, sep } from "node:path";

const ROOT = process.argv[2] || "./app/api";
const DRY = process.argv.includes("--dry");

const TARGET_FILES = new Set(["route.ts", "route.tsx", "route.js"]);
const DIRECTIVE = `export const dynamic = "force-dynamic";\n`;

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (TARGET_FILES.has(e.name)) out.push(p);
  }
  return out;
}

function patch(file) {
  const src = readFileSync(file, "utf8");
  if (/export\s+const\s+dynamic\s*=/.test(src)) {
    return { file, action: "skip-already-has-dynamic" };
  }
  const lines = src.split(/\r?\n/);
  let insertAt = 0;
  let inImport = false;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trimStart();
    if (ln.startsWith('"use ') || ln.startsWith("'use ")) { insertAt = i + 1; continue; }
    if (ln.startsWith("import ") || ln.startsWith("import{") || ln.startsWith("import(")) {
      inImport = true;
      insertAt = i + 1;
      if (!lines[i].includes(";") && !lines[i].endsWith(",")) {
        // multi-line import — keep advancing
      }
      continue;
    }
    if (inImport && (ln.startsWith("from ") || ln.startsWith("} from") || ln.includes("from ") || ln === "")) {
      insertAt = i + 1;
      if (ln === "" && !lines[i + 1]?.trimStart().startsWith("import")) break;
      continue;
    }
    if (ln === "" || ln.startsWith("//") || ln.startsWith("/*") || ln.startsWith("*")) continue;
    break;
  }
  const out = [
    ...lines.slice(0, insertAt),
    "",
    DIRECTIVE.trimEnd(),
    ...lines.slice(insertAt),
  ].join("\n");
  if (!DRY) writeFileSync(file, out, "utf8");
  return { file, action: "patched" };
}

const files = walk(ROOT);
let patched = 0, skipped = 0;
const errors = [];
for (const f of files) {
  try {
    const r = patch(f);
    if (r.action === "patched") patched++;
    else skipped++;
  } catch (e) {
    errors.push({ file: f, error: e.message });
  }
}

console.log(`scanned:  ${files.length}`);
console.log(`patched:  ${patched}${DRY ? " (DRY-RUN)" : ""}`);
console.log(`skipped:  ${skipped} (already had dynamic export)`);
console.log(`errors:   ${errors.length}`);
if (errors.length) errors.slice(0, 5).forEach(e => console.log(`  ! ${e.file}: ${e.error}`));
