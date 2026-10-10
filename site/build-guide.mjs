// Renders docs/USER_GUIDE.md to site/guide.html (no dependencies).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const REPO = 'https://github.com/jm0535/pedon/blob/main/';
const md = readFileSync(new URL('../docs/USER_GUIDE.md', import.meta.url), 'utf8');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = s => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

const fixPath = p => {
  if (/^(https?:|#|mailto:)/.test(p)) return p;
  if (p.endsWith('pedon_logo.png')) return '/pedon_logo.png';
  if (p.startsWith('screenshots/')) return '/' + p;
  return REPO + p.replace(/^\.\.\//, '');
};

const inline = s => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, a, p) => `<img src="${fixPath(p)}" alt="${a}">`)
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, p) => `<a href="${fixPath(p)}">${t}</a>`)
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/\*([^*]+)\*/g, '<i>$1</i>');

const raw = line => line.replace(/(src|href)="([^"]+)"/g, (_, a, p) => `${a}="${fixPath(p)}"`);

const lines = md.split('\n');
const out = [];
let i = 0;
while (i < lines.length) {
  const l = lines[i];
  if (!l.trim()) { i++; continue; }
  if (/^<p align="center"><img[^>]*pedon_logo/.test(l)) { i++; continue; }
  if (/^<img /.test(l.trim())) { out.push(`<div class="shot">${raw(l.trim())}</div>`); i++; continue; }
  if (/^<\w/.test(l.trim())) { out.push(raw(l)); i++; continue; }
  let m;
  if ((m = /^(#{1,3}) (.*)/.exec(l))) {
    const n = m[1].length, t = inline(m[2]);
    out.push(n === 1 ? `<h1>${t}</h1>` : `<h${n} id="${slug(m[2])}">${t}</h${n}>`); i++; continue;
  }
  if (/^---+$/.test(l)) { out.push('<hr>'); i++; continue; }
  if (l.startsWith('>')) {
    const q = []; while (i < lines.length && lines[i].startsWith('>')) q.push(lines[i++].replace(/^>\s?/, ''));
    out.push(`<blockquote>${inline(q.join(' '))}</blockquote>`); continue;
  }
  if (l.startsWith('|')) {
    const rows = []; while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
    const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()));
    const body = rows.slice(2).map(r => `<tr>${cells(r).map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    out.push(`<table><tr>${cells(rows[0]).map(c => `<th>${c}</th>`).join('')}</tr>${body}</table>`); continue;
  }
  if (/^(\d+\.|-) /.test(l)) {
    const ordered = /^\d+\./.test(l), items = [];
    while (i < lines.length && /^(\d+\.|-) /.test(lines[i])) items.push(inline(lines[i++].replace(/^(\d+\.|-) /, '')));
    const tag = ordered ? 'ol' : 'ul';
    out.push(`<${tag}>${items.map(x => `<li>${x}</li>`).join('')}</${tag}>`); continue;
  }
  const p = []; while (i < lines.length && lines[i].trim() && !/^(#|>|\||<|---|\d+\. |- )/.test(lines[i])) p.push(lines[i++]);
  out.push(`<p>${inline(p.join(' '))}</p>`);
}

const tpl = readFileSync(new URL('./guide.template.html', import.meta.url), 'utf8');
mkdirSync(new URL('./guide/', import.meta.url), { recursive: true });
writeFileSync(new URL('./guide/index.html', import.meta.url), tpl.replace('<!--GUIDE-->', out.join('\n')));
console.log('site/guide/index.html written');
