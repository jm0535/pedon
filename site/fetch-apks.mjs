// Downloads the APKs listed in site/release.json into site/downloads/ at deploy
// time and rewrites the URLs so the website serves them from its own domain —
// Android browsers then get a plain same-origin file download instead of a
// redirect chain through github.com. If a download fails the original GitHub
// URL is kept so the site still works.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = dirname(fileURLToPath(import.meta.url));
const relPath = join(siteDir, 'release.json');
const rel = JSON.parse(await readFile(relPath, 'utf8'));
await mkdir(join(siteDir, 'downloads'), { recursive: true });

for (const kind of ['release', 'debug']) {
  const f = rel[kind];
  if (!f?.url || !f.name) continue;
  const dest = join(siteDir, 'downloads', f.name);
  try {
    const res = await fetch(f.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length !== f.size) throw new Error(`size ${buf.length} != ${f.size}`);
    await writeFile(dest, buf);
    f.url = `/downloads/${f.name}`;
    console.log(`downloaded ${f.name} (${buf.length} bytes)`);
  } catch (e) {
    console.warn(`keeping GitHub URL for ${f.name}: ${e.message}`);
  }
}

await writeFile(relPath, JSON.stringify(rel, null, 2) + '\n');
