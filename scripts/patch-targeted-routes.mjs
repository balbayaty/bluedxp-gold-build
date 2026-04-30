// Add `export const dynamic = 'force-dynamic'` to a SPECIFIC list of API
// route paths (not all of them). Reads route paths from FAILING_ROUTES.txt
// where each line is e.g. "/api/auth/me".

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const LIST_FILE = process.argv[2] || "FAILING_ROUTES.txt";
const DRY = process.argv.includes("--dry");
const DIRECTIVE = `export const dynamic = "force-dynamic";`;

const lines = readFileSync(join(ROOT, LIST_FILE), "utf8")
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(l => l.startsWith("/api/"));

let patched = 0, alreadyHad = 0, missing = 0, errors = [];

for (const apiPath of lines) {
  // /api/auth/me  ->  app/api/auth/me/route.{ts,tsx,js}
  const dir = "app" + apiPath;
  const candidates = ["route.ts", "route.tsx", "route.js"]
    .map(n => join(ROOT, dir, n))
    .filter(existsSync);
  if (candidates.length === 0) {
    missing++;
    console.log(`  ! NO route file for ${apiPath}`);
    continue;
  }
  const file = candidates[0];
  try {
    const src = readFileSync(file, "utf8");
    if (/export\s+const\s+dynamic\s*=/.test(src)) { alreadyHad++; continue; }
    const lns = src.split(/\r?\n/);
    let insertAt = 0;
    let inImport = false;
    for (let i = 0; i < lns.length; i++) {
      const ln = lns[i].trimStart();
      if (ln.startsWith('"use ') || ln.startsWith("'use ")) { insertAt = i + 1; continue; }
      if (ln.startsWith("import ") || ln.startsWith("import{") || ln.startsWith("import(")) {
        inImport = true; insertAt = i + 1; continue;
      }
      if (inImport && (ln.includes("from ") || ln === "")) {
        insertAt = i + 1;
        if (ln === "" && !lns[i + 1]?.trimStart().startsWith("import")) break;
        continue;
      }
      if (ln === "" || ln.startsWith("//") || ln.startsWith("/*") || ln.startsWith("*")) continue;
      break;
    }
    const out = [...lns.slice(0, insertAt), "", DIRECTIVE, ...lns.slice(insertAt)].join("\n");
    if (!DRY) writeFileSync(file, out, "utf8");
    patched++;
  } catch (e) { errors.push({ file, error: e.message }); }
}

console.log("");
console.log(`requested:  ${lines.length}`);
console.log(`patched:    ${patched}${DRY ? " (DRY)" : ""}`);
console.log(`alreadyHad: ${alreadyHad}`);
console.log(`missing:    ${missing}`);
console.log(`errors:     ${errors.length}`);
errors.forEach(e => console.log(`  ! ${e.file}: ${e.error}`));
