// Fills in checksums and APK size on the download page.
fetch('releases/SHA256SUMS').then(r=>r.ok?r.text():'').then(t=>{t.split('\n').forEach(l=>{const[h,f]=l.trim().split(/\s+/);const el=f&&document.querySelector('[data-sum="'+f+'"]');if(el)el.textContent=h})}).catch(()=>{});
fetch('releases/Pedon-Studio-2.0.0-release.apk',{method:'HEAD'}).then(r=>{const n=+r.headers.get('content-length');if(n)document.getElementById('size').textContent=(n/1048576).toFixed(1)+' MB'}).catch(()=>{});
