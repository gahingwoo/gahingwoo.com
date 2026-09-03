// Shared behaviour: theme toggle, folded evidence entries, back-to-top.
(function () {
  var root = document.documentElement;

  // Theme. PatternFly 6 switches to dark with a class on <html>; the inline
  // script in each page's <head> applies the saved choice before first paint.
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var dark = root.classList.toggle('pf-v6-theme-dark');
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
    });
  }

  // Fold long entry descriptions. Measured rather than guessed: an entry is
  // folded only if its text is actually taller than the fold. The text stays
  // in the DOM so find-in-page still matches it, and anything reached by an
  // anchor or sent to the printer is opened first.
  var foldPx = null;
  Array.prototype.forEach.call(document.querySelectorAll('.entry'), function (entry, i) {
    var desc = entry.querySelector('.entry-desc');
    if (!desc) return;
    if (foldPx === null) {
      var lh = parseFloat(getComputedStyle(desc).lineHeight) || 21;
      foldPx = lh * 6;
    }
    if (desc.scrollHeight <= foldPx + 28) return;
    entry.classList.add('is-folded');
    var btn = document.createElement('button');
    btn.className = 'pf-v6-c-button pf-m-link pf-m-inline entry-more';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    desc.id = desc.id || ('entry-desc-' + i);
    btn.setAttribute('aria-controls', desc.id);
    btn.innerHTML = '<span class="pf-v6-c-button__text">Show more</span>';
    btn.addEventListener('click', function () {
      var open = !entry.classList.toggle('is-folded');
      btn.querySelector('.pf-v6-c-button__text').textContent = open ? 'Show less' : 'Show more';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (!open) entry.scrollIntoView({ block: 'nearest' });
    });
    desc.insertAdjacentElement('afterend', btn);
  });
  function unfold(el) {
    var entry = el && el.closest ? el.closest('.entry') : null;
    if (entry && entry.classList.contains('is-folded')) {
      var b = entry.querySelector('.entry-more');
      if (b) b.click();
    }
  }
  window.addEventListener('hashchange', function () { unfold(document.getElementById(location.hash.slice(1))); });
  if (location.hash) unfold(document.getElementById(location.hash.slice(1)));
  // Print (and the CV PDF, which is printed by headless Chrome) is always the
  // light theme: drop the dark class while printing and put it back after.
  var wasDark = false;
  window.addEventListener('beforeprint', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.entry.is-folded .entry-more'), function (b) { b.click(); });
    wasDark = root.classList.contains('pf-v6-theme-dark');
    root.classList.remove('pf-v6-theme-dark');
  });
  window.addEventListener('afterprint', function () {
    if (wasDark) root.classList.add('pf-v6-theme-dark');
  });

  // Section bar: mark the section in view. The threshold is the bar's own
  // height plus a little, so a heading counts as current once it has passed
  // under the bar rather than when it merely enters the viewport.
  var bar = document.getElementById('jump-bar');
  if (bar) {
    var links = Array.prototype.slice.call(bar.querySelectorAll('.pf-v6-c-jump-links__item'));
    var targets = links.map(function (li) {
      var a = li.querySelector('a');
      return document.getElementById(a.getAttribute('href').slice(1));
    });
    var spyTicking = false;
    function spy() {
      spyTicking = false;
      var mark = bar.offsetHeight + 40, current = -1;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].getBoundingClientRect().top <= mark) current = i;
      }
      var doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) current = targets.length - 1;
      links.forEach(function (li, i) {
        li.classList.toggle('pf-m-current', i === current);
        if (i === current) li.setAttribute('aria-current', 'location'); else li.removeAttribute('aria-current');
      });
    }
    window.addEventListener('scroll', function () {
      if (!spyTicking) { spyTicking = true; window.requestAnimationFrame(spy); }
    }, { passive: true });
    window.addEventListener('resize', spy, { passive: true });
    spy();
  }

  // Back to top.
  var totop = document.getElementById('back-to-top');
  if (totop) {
    var ticking = false;
    function sync() {
      ticking = false;
      totop.classList.toggle('pf-m-hidden', window.scrollY < 600);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(sync); }
    }, { passive: true });
    sync();
    totop.querySelector('a').addEventListener('click', function (e) {
      e.preventDefault();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
})();
