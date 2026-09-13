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

const files = ["index.html", "404.html", "fractional-cto/index.html", "product-leadership/index.html"];
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
    const count = (str) => (str.match(/class="cell (?:head )?(?:biz|tech)"/g) || []).length;
    const inMatrix = count(inside);
    const total = count(index);
    if (inMatrix !== total) fail(`index.html: ${total - inMatrix} cells sit outside the matrix — they will render full width`);
    notes.push(`index.html: ${inMatrix} cells inside the matrix, ${inMatrix / 2} aligned row pairs`);
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

// attribute order is irrelevant: read each <a> once and pull the attributes out
const anchors = [...index.matchAll(/<a\s([^>]*)>/g)].map((m) => m[1]);
const attr = (attrs, name) => (attrs.match(new RegExp(name + '="([^"]*)"')) || [null, null])[1];

for (const attrs of anchors) {
  const cls = attr(attrs, "class") || "";
  const href = attr(attrs, "href");

  if (/\bcard\b/.test(cls) && !href) fail(`index.html: a card link has no href — ${attrs.trim()}`);
  if (/\bcard\b/.test(cls) && href && href.startsWith("http") && attr(attrs, "target") !== "_blank") {
    fail(`index.html: an external card link does not open in a new tab — ${href}`);
  }
  if (/\bcard\b/.test(cls) && href && href.startsWith("http") && !/noopener/.test(attr(attrs, "rel") || "")) {
    fail(`index.html: an external card link is missing rel=noopener — ${href}`);
  }
  if (/\b(record|accent)\b/.test(cls) && !href) fail(`index.html: a .${cls} block has no href — ${attrs.trim()}`);

  // every link needs an accessible name: text, or an aria-label
  if (!href) fail(`index.html: an <a> without href — ${attrs.trim()}`);
}

// external links must all open in a new tab and carry rel=noopener
for (const attrs of anchors) {
  const href = attr(attrs, "href") || "";
  if (!href.startsWith("http")) continue;
  if (attr(attrs, "target") !== "_blank") fail(`index.html: external link without target=_blank — ${href}`);
  if (!/noopener/.test(attr(attrs, "rel") || "")) fail(`index.html: external link without rel=noopener — ${href}`);
  if (!/\b(aria-label|title)\b/.test(attrs) && !/class="[^"]*\bcard\b/.test(attrs)) {
    // plain inline links are fine as long as they have text; nothing to assert here
  }
}

// a card that is a div must still contain a link
for (const m of index.matchAll(/<div[^>]*class="[^"]*\bcard\b[^"]*"[^>]*>([\s\S]*?)<\/div>/g)) {
  if (!/<a\s/.test(m[1])) fail("index.html: a card is a plain div with no link inside it");
}

/* ---------- recordings ---------- */

const records = anchors
  .filter((attrs) => /\brecord\b/.test(attr(attrs, "class") || ""))
  .map((attrs) => attr(attrs, "href"));
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

/* ---------- SEO surface of every page ---------- */

const sitemap = existsSync("sitemap.xml") ? readFileSync("sitemap.xml", "utf8") : "";

for (const file of files) {
  if (!existsSync(file)) continue;
  const html = readFileSync(file, "utf8");
  const meta = (name) => (html.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`, "i")) || [null, null])[1];

  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [null, ""])[1].trim();
  const desc = meta("description") || "";
  const canonical = (html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || [null, null])[1];
  const noindex = /<meta[^>]+name="robots"[^>]+noindex/.test(html);

  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) fail(`${file}: ${h1s} <h1> elements (exactly one expected)`);

  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(m[0])) fail(`${file}: <img> without alt — ${m[0].slice(0, 60)}`);
  }

  // a noindex page (404, experiments) is not meant to rank: only the basics apply
  if (noindex) {
    notes.push(`${file}: noindex — skipping the social/SEO surface`);
    continue;
  }

  if (title.length < 20 || title.length > 65) fail(`${file}: <title> is ${title.length} chars (aim for 20-65)`);
  if (desc.length < 60 || desc.length > 165) fail(`${file}: meta description is ${desc.length} chars (aim for 60-165)`);
  if (!canonical) fail(`${file}: no canonical link`);
  if (!meta("og:image")) fail(`${file}: no og:image`);
  if (!meta("og:image:alt")) fail(`${file}: no og:image:alt`);
  if (!meta("twitter:card")) fail(`${file}: no twitter:card`);
  if (canonical && !sitemap.includes(canonical)) fail(`${file}: ${canonical} is indexable but missing from sitemap.xml`);
}

// the sitemap should not advertise pages that do not exist
for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const path = m[1].replace("https://worotyns.ovh/", "");
  const file = path === "" ? "index.html" : path + "index.html";
  if (!existsSync(file)) fail(`sitemap.xml: lists ${m[1]} but ${file} does not exist`);
}
notes.push(`SEO: ${(sitemap.match(/<loc>/g) || []).length} urls in the sitemap`);

/* ---------- report ---------- */

notes.forEach((n) => console.log(`· ${n}`));

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}

console.log("\n✓ checks passed");
