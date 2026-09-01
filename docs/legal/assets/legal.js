(function () {
  'use strict';

  var STORAGE_KEY = 'trakl-legal-theme';

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

  function bindReveal() {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items = document.querySelectorAll('.reveal');

    if (reduced || !items.length) {
      for (var i = 0; i < items.length; i++) {
        items[i].classList.add('is-visible');
      }
      return;
    }

    if (!('IntersectionObserver' in window)) {
      for (var j = 0; j < items.length; j++) {
        items[j].classList.add('is-visible');
      }
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
      { threshold: 0.08, rootMargin: '0px 0px -5% 0px' },
    );

    for (var k = 0; k < items.length; k++) {
      items[k].style.transitionDelay = Math.min(k * 55, 440) + 'ms';
      observer.observe(items[k]);
    }
  }

  applyTheme(getTheme());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindThemeToggle();
      bindReveal();
    });
  } else {
    bindThemeToggle();
    bindReveal();
  }
})();
