(function () {
  var STORAGE_KEY = 'trakl-legal-theme';

  function getTheme() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateSwitch(theme);
  }

  function updateSwitch(theme) {
    var buttons = document.querySelectorAll('[data-theme-choice]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var choice = btn.getAttribute('data-theme-choice');
      var active = choice === theme;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  function bindSwitch() {
    var buttons = document.querySelectorAll('[data-theme-choice]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        var choice = this.getAttribute('data-theme-choice');
        if (choice === 'light' || choice === 'dark') {
          applyTheme(choice);
        }
      });
    }
  }

  applyTheme(getTheme());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindSwitch);
  } else {
    bindSwitch();
  }
})();
