/**
 * ==========================================================================
 * SURYA TEXTILES A BILLING SOFTWARE - THEME MANAGER (Dark, Light, System)
 * Handles instant theme switching, localStorage persistence, and dynamic OS
 * prefers-color-scheme detection and updates.
 * ==========================================================================
 */

(function () {
  const THEME_STORAGE_KEY = 'surya_theme';
  const VALID_THEMES = ['dark', 'light', 'system'];

  const ThemeManager = {
    // Current user choice: 'dark', 'light', or 'system'
    currentSetting: 'system',
    // Resolved active appearance: 'dark' or 'light'
    effectiveTheme: 'dark',

    init() {
      // 1. Read stored preference or default to 'system'
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      this.currentSetting = (saved && VALID_THEMES.includes(saved)) ? saved : 'system';

      // 2. Resolve and apply
      this.applyTheme(this.currentSetting, false);

      // 3. Listen for OS prefers-color-scheme changes
      if (window.matchMedia) {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
          if (this.currentSetting === 'system') {
            const newResolved = e.matches ? 'dark' : 'light';
            this.setEffectiveTheme(newResolved);
            this.updateUI();
          }
        };

        if (mql.addEventListener) {
          mql.addEventListener('change', handleChange);
        } else if (mql.addListener) {
          mql.addListener(handleChange);
        }
      }

      // 4. Update UI once DOM is loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.updateUI());
      } else {
        this.updateUI();
      }

      // 5. Delegate theme switcher button clicks
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-theme-choice]');
        if (btn) {
          e.preventDefault();
          const choice = btn.getAttribute('data-theme-choice');
          if (VALID_THEMES.includes(choice)) {
            this.setTheme(choice, true);
          }
        }
      });
    },

    getSystemPreference() {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    },

    setTheme(setting, showNotification = true) {
      if (!VALID_THEMES.includes(setting)) return;

      this.currentSetting = setting;
      localStorage.setItem(THEME_STORAGE_KEY, setting);
      this.applyTheme(setting, showNotification);
    },

    applyTheme(setting, showNotification = false) {
      const resolved = (setting === 'system') ? this.getSystemPreference() : setting;
      this.setEffectiveTheme(resolved);
      document.documentElement.setAttribute('data-theme-setting', setting);
      this.updateUI();

      if (showNotification && typeof window.App?.showToast === 'function') {
        const labels = {
          dark: '🌙 Dark Mode activated',
          light: '☀️ Light Mode activated',
          system: `💻 System Mode synced (${resolved === 'dark' ? 'Dark' : 'Light'})`
        };
        window.App.showToast(labels[setting] || 'Theme updated', 'info');
      }
    },

    setEffectiveTheme(resolved) {
      this.effectiveTheme = resolved;
      document.documentElement.setAttribute('data-theme', resolved);
      
      // Update meta theme-color for mobile browser address bar
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
      }
      metaTheme.content = resolved === 'dark' ? '#0a0d14' : '#f8fafc';
    },

    updateUI() {
      // Update theme selector buttons
      const buttons = document.querySelectorAll('[data-theme-choice]');
      buttons.forEach(btn => {
        const choice = btn.getAttribute('data-theme-choice');
        const isActive = choice === this.currentSetting;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      // Update any theme select dropdowns (e.g., in Settings modal)
      const selects = document.querySelectorAll('#set-theme-preference, select[data-theme-select]');
      selects.forEach(sel => {
        if (sel.value !== this.currentSetting) {
          sel.value = this.currentSetting;
        }
      });
    }
  };

  // Expose globally
  window.ThemeManager = ThemeManager;

  // Initialize immediately
  ThemeManager.init();
})();
