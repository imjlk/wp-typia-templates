import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const docsDir = path.join(rootDir, "docs");
const siteDir = path.join(rootDir, ".pages-site");

const topLevelDocs = fs
  .readdirSync(docsDir, { withFileTypes: true })
  .filter(
    (entry) =>
      entry.isFile() &&
      entry.name.endsWith(".md") &&
      entry.name !== "index.md"
  )
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

const tutorialDocs = fs
  .readdirSync(path.join(docsDir, "tutorials"), { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleFromFilename(filename) {
  return filename
    .replace(/\.md$/u, "")
    .split(/[-_]/u)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildLinkList(basePath, filenames) {
  return filenames
    .map(
      (filename) =>
        `<li><a href="${escapeHtml(path.posix.join(basePath, filename))}">${escapeHtml(titleFromFilename(filename))}</a></li>`
    )
    .join("\n");
}

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }
    fs.copyFileSync(sourcePath, targetPath);
  }
}

fs.rmSync(siteDir, { recursive: true, force: true });
copyDirectory(docsDir, siteDir);

const homepage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>wp-typia Documentation</title>
    <style>
      :root {
        color-scheme: light;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f4f6fb;
        color: #1b263b;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, rgba(54, 118, 255, 0.18), transparent 32rem),
          linear-gradient(180deg, #f7f9fc 0%, #eef3ff 100%);
      }
      main {
        max-width: 58rem;
        margin: 0 auto;
        padding: 4rem 1.5rem 5rem;
      }
      h1 {
        margin: 0 0 0.75rem;
        font-size: clamp(2rem, 4vw, 3.25rem);
        line-height: 1.05;
      }
      p {
        line-height: 1.65;
        max-width: 44rem;
      }
      .hero {
        padding: 2rem 0 2.5rem;
      }
      .grid {
        display: grid;
        gap: 1.25rem;
        grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
      }
      section {
        background: rgba(255, 255, 255, 0.78);
        border: 1px solid rgba(27, 38, 59, 0.08);
        border-radius: 1rem;
        padding: 1.25rem;
        box-shadow: 0 18px 45px rgba(27, 38, 59, 0.08);
        backdrop-filter: blur(8px);
      }
      h2 {
        margin-top: 0;
        font-size: 1.05rem;
      }
      ul {
        margin: 0.75rem 0 0;
        padding-left: 1.1rem;
      }
      li + li {
        margin-top: 0.5rem;
      }
      a {
        color: #1f5cff;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 1.25rem;
        font-size: 0.95rem;
      }
    </style>
  </head>
  <body>
    <main>
      <div class="hero">
        <h1>wp-typia documentation</h1>
        <p>Reference material for the wp-typia packages, scaffolds, migration workflows, and tutorials published from the repository's <code>docs/</code> tree.</p>
        <div class="meta">
          <a href="https://github.com/imjlk/wp-typia">Repository</a>
          <a href="api/README.md">API Reference Index</a>
          <a href="API.md">Docs Build Notes</a>
        </div>
      </div>
      <div class="grid">
        <section>
          <h2>Guides</h2>
          <ul>
${buildLinkList(".", topLevelDocs)}
          </ul>
        </section>
        <section>
          <h2>Tutorials</h2>
          <ul>
${buildLinkList("tutorials", tutorialDocs)}
          </ul>
        </section>
      </div>
    </main>
  </body>
</html>
`;

fs.writeFileSync(path.join(siteDir, "index.html"), homepage, "utf8");
fs.writeFileSync(path.join(siteDir, ".nojekyll"), "", "utf8");
