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

const files = ["index.html", "404.html", "simple/index.html", "simple/tech/index.html", "blocks/index.html"];
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

/* ---------- index.html specific ---------- */

const index = readFileSync("index.html", "utf8");

for (const id of ["main", "about", "services", "work", "experience", "testimonials", "contact"]) {
  if (!index.includes(`id="${id}"`)) fail(`index.html: expected section #${id} is gone — check the nav`);
}

for (const btn of ['data-lane-set="biz"', 'data-lane-set="tech"']) {
  if (!index.includes(btn)) fail(`index.html: track switch button ${btn} missing`);
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

if (!/<a[^>]*class="project project-open/.test(index)) {
  fail("index.html: the open-slot card is not a link — its CTA cannot be clicked");
}

/* ---------- recordings (video facades) ---------- */

const videoIds = [...index.matchAll(/data-video-id="([^"]+)"/g)].map((m) => m[1]);
const facades = (index.match(/class="video-facade"/g) || []).length;

if (!videoIds.length) {
  fail("index.html: no recordings found — did the #talk section get removed?");
} else {
  if (new Set(videoIds).size !== videoIds.length) fail("index.html: the same video id is used twice");
  if (facades !== videoIds.length) {
    fail(`index.html: ${videoIds.length} recordings but ${facades} facades — every .video needs a .video-facade button`);
  }
  if (!/data-video-title=/.test(index)) fail("index.html: recordings are missing data-video-title (used as iframe title)");
  notes.push(`index.html: ${videoIds.length} recordings — ${videoIds.join(", ")}`);

  if (existsSync("llms.txt")) {
    const llms = readFileSync("llms.txt", "utf8");
    for (const id of videoIds) {
      if (!llms.includes(id)) fail(`llms.txt: recording ${id} is not listed under Talks`);
    }
  }
}

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

/* ---------- experiment pages: each one must load its own stylesheet ---------- */

const experiments = {
  "simple/index.html": "simple/styles.css",
  "simple/tech/index.html": "simple/styles.css",
  "blocks/index.html": "blocks/style.css",
};

for (const [file, expected] of Object.entries(experiments)) {
  if (!existsSync(file)) {
    fail(`${file}: experiment page missing`);
    continue;
  }
  const page = readFileSync(file, "utf8");
  const sheets = [...page.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => resolveHref(file, m[1]));
  if (!sheets.includes(expected)) {
    fail(`${file}: loads ${sheets.join(", ") || "no stylesheet"} — it must load ${expected}`);
  }
  notes.push(`${file}: ${Math.round(page.length / 1024)} KB, stylesheets ${sheets.join(" + ")}`);
}

/* ---------- the simple experiment: two tracks, two real URLs ---------- */

const simplePages = {
  biz: "simple/index.html",
  tech: "simple/tech/index.html",
};

if (existsSync(simplePages.biz) || existsSync(simplePages.tech)) {
  for (const [lane, file] of Object.entries(simplePages)) {
    if (!existsSync(file)) {
      fail(`${file}: the ${lane} track of the simple version is missing — the two pages must exist as a pair`);
      continue;
    }
    const page = readFileSync(file, "utf8");
    const otherHref = lane === "biz" ? "/simple/tech/" : "/simple/";
    const otherFile = lane === "biz" ? simplePages.tech : simplePages.biz;
    // the switch must point at the other page, resolved from this page's URL
    const links = [...page.matchAll(/href="([^"]+)"/g)].map((m) => resolveHref(file, m[1]));
    if (!links.includes(otherFile)) {
      fail(`${file}: the track switch does not resolve to ${otherHref} (${otherFile})`);
    }
    if (!/aria-current="page"/.test(page)) {
      fail(`${file}: the track switch does not mark the current page`);
    }
    notes.push(`${file}: ${lane} track`);
  }
}

/* ---------- report ---------- */

notes.forEach((n) => console.log(`· ${n}`));

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}

console.log("\n✓ checks passed");
