// Shared behaviour: theme toggle, folded evidence entries, back-to-top.
(function () {
  var root = document.documentElement;
  // The page is PatternFly's app shell, so the thing that scrolls is the main
  // container, not the window. Everything below watches and drives that.
  var scroller = document.querySelector('.pf-v6-c-page__main') || document.scrollingElement;
  function onScroll(fn) { scroller.addEventListener('scroll', fn, { passive: true }); }

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

  // Sidebar. PatternFly shows it from xl and hides it below; the hamburger
  // slides it in and out. A choice inside it closes it on small screens.
  var sidebar = document.getElementById('site-sidebar');
  var navToggle = document.getElementById('nav-toggle');
  var wide = window.matchMedia('(min-width: 75rem)');
  function setSidebar(open) {
    sidebar.classList.toggle('pf-m-expanded', open);
    sidebar.classList.toggle('pf-m-collapsed', !open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (sidebar && navToggle) {
    setSidebar(wide.matches);
    wide.addEventListener('change', function (e) { setSidebar(e.matches); });
    navToggle.addEventListener('click', function () { setSidebar(!sidebar.classList.contains('pf-m-expanded')); });
    sidebar.addEventListener('click', function (e) { if (e.target.closest('a') && !wide.matches) setSidebar(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !wide.matches) setSidebar(false); });
  }

  // On this page: the toggle below xl, and the section in view lit on the rail.
  var jumpNav = document.getElementById('jump-nav');
  var jumpToggle = document.getElementById('jump-toggle');
  if (jumpNav && jumpToggle) {
    jumpToggle.addEventListener('click', function () {
      var open = jumpNav.classList.toggle('pf-m-expanded');
      jumpToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    jumpNav.addEventListener('click', function (e) {
      if (e.target.closest('a') && !wide.matches) {
        jumpNav.classList.remove('pf-m-expanded');
        jumpToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var jumpList = document.getElementById('jump-list');
  if (jumpList) {
    var items = Array.prototype.slice.call(jumpList.querySelectorAll('.pf-v6-c-jump-links__item'));
    var targets = items.map(function (li) { return document.getElementById(li.querySelector('a').getAttribute('href').slice(1)); });
    var spyTicking = false;
    function spy() {
      spyTicking = false;
      var top = scroller.getBoundingClientRect().top, mark = top + 96, current = -1;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].getBoundingClientRect().top <= mark) current = i;
      }
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) current = targets.length - 1;
      if (current < 0) current = 0;
      items.forEach(function (li, i) {
        li.classList.toggle('pf-m-current', i === current);
        if (i === current) li.setAttribute('aria-current', 'location'); else li.removeAttribute('aria-current');
      });
    }
    onScroll(function () {
      if (!spyTicking) { spyTicking = true; window.requestAnimationFrame(spy); }
    });
    window.addEventListener('resize', spy, { passive: true });
    spy();
  }

  // Entry counts are read off the page, so a hand-added entry cannot leave a
  // stale number in a title on a page whose point is that its numbers hold.
  var total = document.getElementById('entry-count');
  if (total) total.textContent = document.querySelectorAll('.entry').length;
  Array.prototype.forEach.call(document.querySelectorAll('.section'), function (sec) {
    var c = sec.querySelector('.pf-v6-c-card__title-text .count');
    if (c) c.textContent = sec.querySelectorAll('.entry').length;
  });

  // Back to top.
  var totop = document.getElementById('back-to-top');
  if (totop) {
    var ticking = false;
    // Shown once the reader is well down a page that is long enough for the
    // trip back to be worth a button: two screens or more.
    function sync() {
      ticking = false;
      var longEnough = scroller.scrollHeight > scroller.clientHeight * 2;
      totop.classList.toggle('pf-m-hidden', !longEnough || scroller.scrollTop < 600);
    }
    onScroll(function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(sync); }
    });
    sync();
    totop.querySelector('a').addEventListener('click', function (e) {
      e.preventDefault();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      scroller.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
})();
