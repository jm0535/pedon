// Dark/light theme: follows the system until the user picks one, then remembers it.
(function () {
  var KEY = 'pedon_site_theme', root = document.documentElement;
  var sys = function () { return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; };
  var saved = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var apply = function (t) {
    root.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name=theme-color]');
    if (m) m.content = t === 'light' ? '#f8f9fa' : '#121216';
    var b = document.getElementById('themeToggle');
    if (b) {
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      b.innerHTML = t === 'dark'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
  };
  apply(saved() || sys());
  document.addEventListener('DOMContentLoaded', function () {
    apply(root.getAttribute('data-theme'));
    document.getElementById('themeToggle').addEventListener('click', function () {
      var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, t); } catch (e) {}
      apply(t);
    });
  });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { if (!saved()) apply(sys()); });
})();
