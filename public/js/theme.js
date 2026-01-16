/**
 * Theme Manager Module
 * Handles light/dark theme switching with cookie persistence
 * Supports: light, dark, system (follows OS preference)
 */

const ThemeManager = (function() {
  // Configuration
  const COOKIE_NAME = 'theme_preference';
  const COOKIE_DAYS = 365;
  const THEMES = ['light', 'dark', 'system'];
  
  // Icons for theme states
  const ICONS = {
    light: '☀️',
    dark: '🌙',
    system: '💻'
  };
  
  /**
   * Set a cookie with the specified name, value, and expiration days
   */
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + value + ';' + expires + ';path=/;SameSite=Lax';
  }
  
  /**
   * Get the value of a cookie by name
   */
  function getCookie(name) {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }
    return null;
  }
  
  /**
   * Get the system's preferred color scheme
   */
  function getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  
  /**
   * Get the effective theme (resolves 'system' to actual theme)
   */
  function getEffectiveTheme(preference) {
    if (preference === 'system') {
      return getSystemPreference();
    }
    return preference;
  }
  
  /**
   * Get the stored theme preference from cookie
   */
  function getStoredPreference() {
    const stored = getCookie(COOKIE_NAME);
    if (stored && THEMES.includes(stored)) {
      return stored;
    }
    return 'system'; // Default to system preference
  }
  
  /**
   * Apply the theme to the document
   */
  function applyTheme(theme) {
    const effectiveTheme = getEffectiveTheme(theme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    
    // Update meta theme-color for mobile browsers
    updateMetaThemeColor(effectiveTheme);
  }
  
  /**
   * Update the meta theme-color for mobile browser chrome
   */
  function updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = theme === 'dark' ? '#1e1e1e' : '#ffffff';
  }
  
  /**
   * Save theme preference to cookie
   */
  function savePreference(theme) {
    if (THEMES.includes(theme)) {
      setCookie(COOKIE_NAME, theme, COOKIE_DAYS);
    }
  }
  
  /**
   * Get the next theme in rotation
   */
  function getNextTheme(current) {
    const currentIndex = THEMES.indexOf(current);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    return THEMES[nextIndex];
  }
  
  /**
   * Update all theme select dropdowns with the current state
   */
  function updateThemeSelects(preference) {
    const selects = document.querySelectorAll('.theme-select');
    
    selects.forEach(select => {
      select.value = preference;
    });
  }
  
  /**
   * Initialize theme select dropdowns
   */
  function initThemeSelects() {
    const selects = document.querySelectorAll('.theme-select');
    
    selects.forEach(select => {
      select.addEventListener('change', function(e) {
        const newTheme = this.value;
        
        if (THEMES.includes(newTheme)) {
          savePreference(newTheme);
          applyTheme(newTheme);
          updateThemeSelects(newTheme);
        }
      });
    });
  }
  
  /**
   * Listen for system theme changes
   */
  function listenForSystemChanges() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      mediaQuery.addEventListener('change', function(e) {
        const preference = getStoredPreference();
        // Only react if user has 'system' preference
        if (preference === 'system') {
          applyTheme('system');
        }
      });
    }
  }
  
  /**
   * Initialize the theme manager
   * Called on page load
   */
  function init() {
    // Disable transitions during initial load to prevent flash
    document.documentElement.classList.add('no-transitions');
    
    const preference = getStoredPreference();
    applyTheme(preference);
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        initThemeSelects();
        updateThemeSelects(preference);
        listenForSystemChanges();
        
        // Re-enable transitions after a brief delay
        setTimeout(function() {
          document.documentElement.classList.remove('no-transitions');
        }, 100);
      });
    } else {
      initThemeSelects();
      updateThemeSelects(preference);
      listenForSystemChanges();
      
      setTimeout(function() {
        document.documentElement.classList.remove('no-transitions');
      }, 100);
    }
  }
  
  /**
   * Set theme programmatically
   */
  function setTheme(theme) {
    if (THEMES.includes(theme)) {
      savePreference(theme);
      applyTheme(theme);
      updateToggleButtons(theme);
    }
  }
  
  /**
   * Get current theme preference
   */
  function getCurrentPreference() {
    return getStoredPreference();
  }
  
  /**
   * Get current effective theme (what's actually displayed)
   */
  function getCurrentTheme() {
    return getEffectiveTheme(getStoredPreference());
  }
  
  // Initialize immediately (before DOM ready to prevent flash)
  init();
  
  // Public API
  return {
    setTheme: setTheme,
    getCurrentPreference: getCurrentPreference,
    getCurrentTheme: getCurrentTheme,
    THEMES: THEMES
  };
})();

// Make available globally
window.ThemeManager = ThemeManager;
