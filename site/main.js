// Points download buttons at the current GitHub Release described in /release.json.
fetch('/release.json').then(r => r.ok ? r.json() : null).then(rel => {
  if (!rel) return;
  const mb = n => (n / 1048576).toFixed(1) + ' MB';
  for (const kind of ['release', 'debug']) {
    const f = rel[kind];
    if (!f) continue;
    document.querySelectorAll(`[data-apk="${kind}"]`).forEach(a => { a.href = f.url; });
    document.querySelectorAll(`[data-name="${kind}"]`).forEach(el => { el.textContent = f.name; });
    document.querySelectorAll(`[data-sum="${kind}"]`).forEach(el => { el.textContent = f.sha256; });
  }
  document.querySelectorAll('[data-version]').forEach(el => { el.textContent = rel.version; });
  const size = document.getElementById('size');
  if (size && rel.release) size.textContent = mb(rel.release.size);
  document.querySelectorAll('[data-release-page]').forEach(a => { a.href = rel.page; });
}).catch(() => {});
