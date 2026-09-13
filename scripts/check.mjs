/**
 * Lightweight sanity check for the static site — no dependencies.
 *   npm: node scripts/check.mjs      task: task check
 *
 * Validates the things that silently rot in a hand-written HTML site:
 * broken anchors, unbalanced track (biz/tech) variants, stale JSON-LD,
 * and the mono ASCII panel that overflows the hero card if a line grows.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const files = ["index.html", "404.html"];
const problems = [];
const notes = [];

function fail(msg) {
  problems.push(msg);
}

/* ---------- per-file checks ---------- */

for (const file of files) {
  if (!existsSync(file)) {
    fail(`${file}: missing`);
    continue;
  }

  const html = readFileSync(file, "utf8");

  // 1. every internal anchor has a target on the same page
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  for (const a of new Set(anchors)) {
    if (!ids.has(a)) fail(`${file}: anchor #${a} has no matching id`);
  }

  // 2. referenced local assets exist (resolve ../ against the file's folder)
  const assets = [...html.matchAll(/(?:src|href)="([^"?#]+\.(?:css|js|jpg|jpeg|png|svg|webmanifest|ico))"/gi)]
    .map((m) => m[1])
    .filter((a) => !/^https?:/i.test(a));
  for (const a of new Set(assets)) {
    const resolved = a.startsWith("/") ? a.slice(1) : join(dirname(file), a);
    if (!existsSync(resolved)) fail(`${file}: asset ${a} not found on disk (looked for ${resolved})`);
  }

  // 3. track variants: .only-biz and .only-tech should come in pairs
  //    (blocks that are intentionally one-track only — project stacks — are stripped)
  const paired = html.replace(/class="[^"]*project-stack[^"]*"/g, "");
  const biz = (paired.match(/only-biz/g) || []).length;
  const tech = (paired.match(/only-tech/g) || []).length;
  if (biz || tech) {
    notes.push(`${file}: track variants — only-biz ${biz} / only-tech ${tech}`);
    if (biz === 0 || tech === 0) fail(`${file}: one track has no content at all`);
    if (Math.abs(biz - tech) > 2) {
      fail(`${file}: track variants are lopsided (${biz} biz vs ${tech} tech) — a section is probably missing a translation`);
    }
  }

  // 4. JSON-LD parses
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      fail(`${file}: invalid JSON-LD — ${e.message}`);
    }
  }

  // 5. the ASCII panel must fit the hero card (≈58 chars at desktop size)
  const ascii = html.match(/<pre class="ascii">([\s\S]*?)<\/pre>/);
  if (ascii) {
    const longest = Math.max(...ascii[1].split("\n").map((l) => l.length));
    notes.push(`${file}: ascii panel longest line ${longest} chars`);
    if (longest > 56) fail(`${file}: ascii panel line is ${longest} chars — it will overflow the card`);
  }

  // 6. no placeholder text left behind
  for (const bad of ["Lorem ipsum", "lorem ipsum", "TODO", "FIXME", "XXX"]) {
    if (html.includes(bad)) fail(`${file}: placeholder text "${bad}"`);
  }
}

/* ---------- index.html: the single page ---------- */

const index = readFileSync("index.html", "utf8");

// anchors the hero and the track switches point at
for (const id of ["biz", "tech", "work"]) {
  if (!index.includes(`id="${id}"`)) fail(`index.html: expected #${id} — the track switches or the hero link point at it`);
}

// the matrix must contain every cell: it once closed early, which silently
// pushed the last groups out to <body> and rendered them in one column
{
  const start = index.indexOf('<div class="matrix">');
  const marker = index.indexOf("<!-- ============ BELOW THE MATRIX");
  if (start === -1 || marker === -1) {
    fail("index.html: cannot find the matrix or its end marker");
  } else {
    let depth = 0;
    let closesAt = -1;
    for (const m of index.matchAll(/<div\b|<!--\s*<\/div>|\/div>/g)) {
      if (m.index < start) continue;
      depth += m[0].startsWith("<div") ? 1 : -1;
      if (depth === 0) { closesAt = m.index; break; }
    }
    if (closesAt === -1 || closesAt > marker) {
      fail("index.html: the matrix does not close before its end marker — cells are leaking out of the grid");
    }
    const inside = index.slice(start, closesAt);
    const inMatrix = (inside.match(/class="cell/g) || []).length;
    const total = (index.match(/class="cell/g) || []).length;
    if (inMatrix !== total) fail(`index.html: ${total - inMatrix} cells sit outside the matrix — they will render full width`);
    notes.push(`index.html: ${inMatrix} cells inside the matrix, ${inMatrix / 2} aligned rows`);
  }
}

// sections must balance too: a missing </section> once swallowed the strip
{
  const opens = (index.match(/<section\b/g) || []).length;
  const closes = (index.match(/<\/section>/g) || []).length;
  if (opens !== closes) fail(`index.html: ${opens} <section> vs ${closes} </section> — a section is not closed`);
}

// the whole point of the layout: every business cell has a technology cell,
// so the rows line up. A missing one silently breaks the alignment.
const bizCells = (index.match(/class="cell(?: head)? biz"/g) || []).length;
const techCells = (index.match(/class="cell(?: head)? tech"/g) || []).length;
if (bizCells !== techCells) {
  fail(`index.html: ${bizCells} business cells vs ${techCells} technology cells — the matrix would fall out of alignment`);
}

// every product card must be clickable, and open in a new tab
for (const m of index.matchAll(/<div[^>]*class="[^"]*\bcard\b[^"]*"[^>]*>([\s\S]*?)<\/div>/g)) {
  if (!/<a\s/.test(m[1])) fail("index.html: a card is a plain div with no link inside it");
}
for (const m of index.matchAll(/<a[^>]*class="[^"]*\bcard\b[^"]*"([^>]*)>/g)) {
  const attrs = m[1];
  if (!/href="/.test(attrs)) fail(`index.html: a card link has no href — ${attrs.trim()}`);
  // mailto cards are exempt: they open a mail client, not a tab
  const external = /href="https?:/.test(attrs);
  if (external && !/target="_blank"/.test(attrs)) fail(`index.html: an external card link does not open in a new tab — ${attrs.trim()}`);
  if (external && !/rel="[^"]*noopener/.test(attrs)) fail(`index.html: an external card link opens a new tab without rel=noopener — ${attrs.trim()}`);
}

// no dead CTAs anywhere
for (const m of index.matchAll(/<a[^>]*class="block accent"([^>]*)>/g)) {
  if (!/href="/.test(m[1])) fail("index.html: an accent block (a CTA) has no href");
}


/* ---------- llms.txt (machine-readable summary) ---------- */

if (!existsSync("llms.txt")) {
  fail("llms.txt: missing — AI assistants read this file to describe you");
} else {
  const llms = readFileSync("llms.txt", "utf8");

  if (!/^# .+/m.test(llms)) fail("llms.txt: no H1 title on the first line");
  if (!/^> .+/m.test(llms)) fail("llms.txt: no '> summary' blockquote after the title");
  if (!llms.includes("175 PLN")) fail("llms.txt: hourly rate (175 PLN) is missing");
  if (!llms.includes("https://worotyns.ovh/")) fail("llms.txt: canonical site URL missing");
  if (!llms.includes("i@worotyns.ovh")) fail("llms.txt: contact e-mail missing");

  // every project on the site should be mentioned with its URL
  for (const url of ["pushpushgo.com", "terapeuto.com", "uff.email", "getviamsg.wdft.ovh"]) {
    if (!llms.includes(url)) fail(`llms.txt: project ${url} is not mentioned`);
  }

  const links = (llms.match(/https?:\/\//g) || []).length;
  notes.push(`llms.txt: ${llms.split("\n").length} lines, ${links} links, rate declared`);
}

/* ---------- clickable cards ---------- */

// a project card either is a link itself, or must contain one — the "your project"
// slot once shipped as an <article> with a dead CTA and no href inside
for (const m of index.matchAll(/<article[^>]*class="project[^"]*"[^>]*>([\s\S]*?)<\/article>/g)) {
  if (!/<a\s/.test(m[1])) {
    fail("index.html: a project card is neither a link nor contains one — its CTA cannot be clicked");
  }
}

/* ---------- recordings ---------- */

const records = [...index.matchAll(/<a[^>]*class="[^"]*\brecord\b[^"]*"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
if (!records.length) fail("index.html: no recordings found — did the watch list get removed?");
for (const url of records) {
  if (!/^https:\/\/www\.youtube\.com\/watch\?v=/.test(url)) fail(`index.html: a recording links somewhere unexpected — ${url}`);
}
const recordImgs = (index.match(/class="thumb"/g) || []).length;
if (recordImgs !== records.length) fail(`index.html: ${records.length} recordings but ${recordImgs} thumbnails`);
if (existsSync("llms.txt")) {
  const llms = readFileSync("llms.txt", "utf8");
  for (const url of records) {
    const id = url.split("v=")[1];
    if (!llms.includes(id)) fail(`llms.txt: recording ${id} is not listed under Talks`);
  }
}
notes.push(`index.html: ${records.length} recordings with thumbnails`);

/* ---------- internal links must resolve to a real file ---------- */

function resolveHref(pageFile, href) {
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")) return null;
  let p = href.split("?")[0].split("#")[0];
  if (!p) return null;
  p = p.startsWith("/") ? p.slice(1) : join(dirname(pageFile), p);
  if (p === "" || p === ".") return "index.html";
  if (p.endsWith("/")) p += "index.html";
  return p;
}

for (const file of files) {
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/href="([^"#][^"]*)"/g)) {
    const target = resolveHref(file, m[1]);
    if (!target) continue;
    if (!existsSync(target)) {
      fail(`${file}: link ${m[1]} points at ${target}, which does not exist`);
    }
  }
}

/* ---------- the page must load the vendored library and its own sheet ---------- */

{
  const page = readFileSync("index.html", "utf8");
  const sheets = [...page.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => resolveHref("index.html", m[1]));
  for (const expected of ["vendor/reset.min.css", "vendor/blocks.min.css", "styles.css"]) {
    if (!sheets.includes(expected)) fail(`index.html: does not load ${expected} (loads ${sheets.join(", ")})`);
  }
  notes.push(`index.html: stylesheets ${sheets.join(" + ")}`);
}

/* ---------- report ---------- */

notes.forEach((n) => console.log(`· ${n}`));

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}

console.log("\n✓ checks passed");
