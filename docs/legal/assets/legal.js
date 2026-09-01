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
      /* ignore storage errors */
    }

    var buttons = document.querySelectorAll('[data-theme-choice]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var active = btn.getAttribute('data-theme-choice') === theme;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var staticReveal = document.querySelectorAll('.reveal');
      for (var s = 0; s < staticReveal.length; s++) {
        staticReveal[s].classList.add('is-visible');
      }
      return;
    }

    var items = document.querySelectorAll('.reveal');
    if (!items.length || !('IntersectionObserver' in window)) {
      for (var f = 0; f < items.length; f++) {
        items[f].classList.add('is-visible');
      }
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    for (var i = 0; i < items.length; i++) {
      observer.observe(items[i]);
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
