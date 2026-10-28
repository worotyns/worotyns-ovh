/**
 * Sanity check for the static site — no dependencies.  task check
 * Catches what rots in hand-written HTML: broken local links and assets,
 * external links that open in place, unclosed tags, a stale ?v= hash.
 */

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const files = ["index.html", "404.html"];
const problems = [];
const fail = (msg) => problems.push(msg);
const hash = (f) => createHash("sha1").update(readFileSync(f)).digest("hex").slice(0, 8);

// Commented-out markup is not served, so it must not be link-checked either
// (a parked link in a comment once made `task check` fail on every run).
const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, "");

for (const file of files) {
  const html = stripComments(readFileSync(file, "utf8"));

  // local links and assets exist
  for (const m of html.matchAll(/(?:src|href)="(\/[^"?#]*)/g)) {
    let p = m[1].slice(1);
    if (p === "" || p.endsWith("/")) p += "index.html";
    if (!existsSync(p)) fail(`${file}: ${m[1]} does not exist`);
  }

  // external links open in a new tab, with noopener
  for (const m of html.matchAll(/<a\s([^>]*href="https?:[^"]*"[^>]*)>/g)) {
    if (!/target="_blank"/.test(m[1]) || !/noopener/.test(m[1])) fail(`${file}: external link without target/noopener — ${m[1]}`);
  }

  if ((html.match(/<h1[\s>]/g) || []).length !== 1) fail(`${file}: exactly one <h1> expected`);

  for (const tag of ["main", "p", "dl", "div"]) {
    const opens = (html.match(new RegExp(`<${tag}\\b`, "g")) || []).length;
    const closes = (html.match(new RegExp(`</${tag}>`, "g")) || []).length;
    if (opens !== closes) fail(`${file}: ${opens} <${tag}> vs ${closes} </${tag}>`);
  }

  // Cloudflare's Browser Cache TTL once served stale CSS for hours after a
  // deploy, so the stylesheet and the og image are content-addressed
  if (!html.includes(`/styles.css?v=${hash("styles.css")}`)) fail(`${file}: styles.css hash is stale — run: task cache-bust`);
  if (html.includes("ogimage.jpg") && !html.includes(`ogimage.jpg?v=${hash("ogimage.jpg")}`)) fail(`${file}: ogimage.jpg hash is stale — run: task cache-bust`);
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log("✓ checks passed");
