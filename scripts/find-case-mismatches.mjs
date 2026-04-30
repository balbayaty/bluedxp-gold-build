#!/usr/bin/env node
/**
 * Walks all .ts/.tsx files and finds imports whose case-exact target
 * does NOT exist on the filesystem. These are the imports that will
 * break on Linux (CI / production) but silently work on Windows.
 */
import { readdirSync, statSync, readFileSync, existsSync, realpathSync } from "node:fs";
import { join, dirname, resolve, sep, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "ci-log-1", "ci-log-2", "ci-log-3", "ci-log-4",
  "scripts", "tests", "__tests__", "coverage", "out", "dist", "build", ".vercel"
]);
const SRC_EXTS = [".ts", ".tsx", ".js", ".jsx"];
const RESOLVE_EXTS = [".ts", ".tsx", ".js", ".jsx", ".d.ts", ".json"];

function walk(dir, files = []) {
  let ents;
  try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return files; }
  for (const e of ents) {
    if (e.name.startsWith(".") && e.name !== ".env.example") continue;
    if (SKIP_DIRS.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, files);
    else if (SRC_EXTS.some((x) => e.name.endsWith(x))) files.push(full);
  }
  return files;
}

/** Case-exact existence check. On Windows, existsSync() is case-insensitive,
 *  so we manually check each path segment via readdirSync(parent). */
function caseExactExists(absPath) {
  if (!existsSync(absPath)) return false;
  let cur = absPath;
  const root = resolve("/");
  while (cur !== root && cur !== dirname(cur)) {
    const parent = dirname(cur);
    const want = basename(cur);
    let ents;
    try { ents = readdirSync(parent); } catch { return false; }
    if (!ents.includes(want)) return false;
    cur = parent;
  }
  return true;
}

function tryResolve(base, spec) {
  // Resolve aliased '@/...' to ROOT
  let target;
  if (spec.startsWith("@/")) {
    target = join(ROOT, spec.slice(2));
  } else if (spec.startsWith(".")) {
    target = resolve(dirname(base), spec);
  } else {
    return { kind: "external", target: spec };
  }

  // Try every extension and /index.ext
  for (const ext of RESOLVE_EXTS) {
    const p = target + ext;
    if (caseExactExists(p)) return { kind: "ok", target: p };
  }
  for (const ext of RESOLVE_EXTS) {
    const p = join(target, "index" + ext);
    if (caseExactExists(p)) return { kind: "ok", target: p };
  }

  // If it exists case-insensitively but not case-exact -> mismatch!
  for (const ext of RESOLVE_EXTS) {
    if (existsSync(target + ext)) return { kind: "case-mismatch", target: target + ext };
    if (existsSync(join(target, "index" + ext))) return { kind: "case-mismatch", target: join(target, "index" + ext) };
  }
  return { kind: "missing", target };
}

const files = walk(ROOT);
console.log(`Scanning ${files.length} files...`);

const importRe = /(?:^|\n)\s*(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;

const issues = [];
for (const file of files) {
  let src;
  try { src = readFileSync(file, "utf8"); } catch { continue; }
  for (const m of src.matchAll(importRe)) {
    const spec = m[1];
    if (!spec.startsWith("@/") && !spec.startsWith(".")) continue;
    const r = tryResolve(file, spec);
    if (r.kind === "case-mismatch") {
      issues.push({ file: file.replace(ROOT + sep, ""), spec, actual: r.target.replace(ROOT + sep, "") });
    }
  }
}

if (issues.length === 0) {
  console.log("\nNo case-mismatch imports found. Safe for Linux deployment.");
  process.exit(0);
}

console.log(`\nFound ${issues.length} case-mismatch imports:\n`);
for (const i of issues) {
  console.log(`  ${i.file}`);
  console.log(`    imports:  ${i.spec}`);
  console.log(`    actual:   ${i.actual}`);
  console.log("");
}
process.exit(1);
