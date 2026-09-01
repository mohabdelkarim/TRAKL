(function () {
  'use strict';

  var STORAGE_KEY = 'trakl-legal-theme';

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function getTheme() {
    var saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* ignore */
    }

    var buttons = document.querySelectorAll('[data-theme-choice]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var active = btn.getAttribute('data-theme-choice') === theme;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('is-active', active);
    }
  }

  function bindThemeToggle() {
    var buttons = document.querySelectorAll('[data-theme-choice]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (event) {
        event.preventDefault();
        var choice = this.getAttribute('data-theme-choice');
        if (choice === 'light' || choice === 'dark') {
          applyTheme(choice);
        }
      });
    }
  }

  function markVisible(items) {
    for (var i = 0; i < items.length; i++) {
      items[i].classList.add('is-visible');
    }
  }

  function applyStaggerDelays(items, step, max) {
    for (var i = 0; i < items.length; i++) {
      items[i].style.transitionDelay = Math.min(i * step, max) + 'ms';
    }
  }

  function bindPageLoad() {
    var reduced = prefersReducedMotion();
    var hero = document.querySelectorAll('.page-title, .page-meta, .lead.reveal-load');

    if (reduced) {
      markVisible(hero);
      return;
    }

    for (var i = 0; i < hero.length; i++) {
      hero[i].classList.add('reveal-load');
      hero[i].style.animationDelay = (0.12 + i * 0.08) + 's';
    }
  }

  function bindReveal() {
    var reduced = prefersReducedMotion();
    var items = document.querySelectorAll('.reveal');

    if (reduced || !items.length) {
      markVisible(items);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      markVisible(items);
      return;
    }

    var groupBuckets = [];
    function bucketFor(item) {
      var named = item.closest('[data-reveal-group]');
      var key = named ? 'name:' + named.getAttribute('data-reveal-group') : item.parentElement;
      for (var g = 0; g < groupBuckets.length; g++) {
        if (groupBuckets[g].key === key) return groupBuckets[g];
      }
      var bucket = { key: key, items: [] };
      groupBuckets.push(bucket);
      return bucket;
    }

    for (var i = 0; i < items.length; i++) {
      bucketFor(items[i]).items.push(items[i]);
    }

    for (var b = 0; b < groupBuckets.length; b++) {
      applyStaggerDelays(groupBuckets[b].items, 65, 480);
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -4% 0px' },
    );

    for (var j = 0; j < items.length; j++) {
      observer.observe(items[j]);
    }
  }

  function bindFooterReveal() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return;

    footer.classList.add('reveal');

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      footer.classList.add('is-visible');
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px 0px 0px' },
    );

    observer.observe(footer);
  }

  function init() {
    bindThemeToggle();
    bindPageLoad();
    bindReveal();
    bindFooterReveal();
  }

  applyTheme(getTheme());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
