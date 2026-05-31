// SlotRace SPA Router and Application Controller

// Dynamic Theme Color Engine
window.applyMainColor = function(hexColor) {
  const hex = hexColor || '#dc3545';
  
  // Convert hex to rgb
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Darken colors for hover/active states
  const darken = (c, pct) => Math.max(0, Math.min(255, Math.round(c * (1 - pct))));
  const hoverHex = `#${darken(r, 0.15).toString(16).padStart(2, '0')}${darken(g, 0.15).toString(16).padStart(2, '0')}${darken(b, 0.15).toString(16).padStart(2, '0')}`;
  const activeHex = `#${darken(r, 0.25).toString(16).padStart(2, '0')}${darken(g, 0.25).toString(16).padStart(2, '0')}${darken(b, 0.25).toString(16).padStart(2, '0')}`;
  
  let styleTag = document.getElementById('dynamic-theme-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-theme-style';
    document.head.appendChild(styleTag);
  }
  
  styleTag.innerHTML = `
    :root {
      --bs-primary: ${hex} !important;
      --bs-primary-rgb: ${r}, ${g}, ${b} !important;
      --bs-primary-hover: ${hoverHex} !important;
      --bs-primary-active: ${activeHex} !important;
      --bs-link-color: ${hex} !important;
      --bs-link-hover-color: ${hoverHex} !important;
      --bs-focus-ring-color: rgba(${r}, ${g}, ${b}, 0.25) !important;
      --bs-primary-bg-subtle: rgba(${r}, ${g}, ${b}, 0.1) !important;
      --bs-primary-border-subtle: rgba(${r}, ${g}, ${b}, 0.2) !important;
    }
    
    .text-danger {
      color: ${hex} !important;
    }
    
    .nav-pills .nav-link.active,
    .nav-pills .show > .nav-link {
      background-color: var(--bs-primary) !important;
      color: #ffffff !important;
    }
    
    .nav-tabs .nav-link.active {
      background-color: var(--bs-primary) !important;
      color: #ffffff !important;
      border-color: var(--bs-primary) !important;
    }
    
    .btn-primary {
      --bs-btn-bg: var(--bs-primary) !important;
      --bs-btn-border-color: var(--bs-primary) !important;
      --bs-btn-hover-bg: ${hoverHex} !important;
      --bs-btn-hover-border-color: ${hoverHex} !important;
      --bs-btn-active-bg: ${activeHex} !important;
      --bs-btn-active-border-color: ${activeHex} !important;
      --bs-btn-focus-shadow-rgb: ${r}, ${g}, ${b} !important;
    }
  `;
};

// Dynamic Dark/Light Theme Engine
window.applyTheme = function(theme) {
  const themeLink = document.getElementById('theme-stylesheet');
  let stylesheetPath = '';
  
  if (theme === 'tailwind_dark') {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    document.documentElement.setAttribute('data-theme-style', 'tailwind');
    stylesheetPath = 'css/themes/tailwind-dark.css';
  } else if (theme === 'tailwind_light') {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    document.documentElement.setAttribute('data-theme-style', 'tailwind');
    stylesheetPath = 'css/themes/tailwind-light.css';
  } else if (theme === 'light') {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    document.documentElement.removeAttribute('data-theme-style');
    stylesheetPath = 'css/themes/bootstrap-light.css';
  } else {
    // Default to dark theme
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    document.documentElement.removeAttribute('data-theme-style');
    stylesheetPath = 'css/themes/bootstrap-dark.css';
  }
  
  if (themeLink) {
    themeLink.setAttribute('href', stylesheetPath);
  }
};

// Global Translation (i18n) Engine
window.currentLanguage = 'en'; // default
window.t = function(key) {
  const lang = window.currentLanguage || 'en';
  const strings = window.localeStrings[lang] || window.localeStrings['en'] || {};
  
  const keys = key.split('.');
  let value = strings;
  for (const k of keys) {
    if (value && value[k] !== undefined) {
      value = value[k];
    } else {
      // Fallback to English
      let fallbackValue = window.localeStrings['en'];
      for (const fk of keys) {
        if (fallbackValue && fallbackValue[fk] !== undefined) {
          fallbackValue = fallbackValue[fk];
        } else {
          fallbackValue = null;
          break;
        }
      }
      return fallbackValue || key;
    }
  }
  return value;
};

// Active sub-route session memory
let lastSettingsSubRoute = 'informations';
let lastRegistrationsSubRoute = 'drivers';

function handleRoute() {
  // Get current hash, defaulting to #dashboard
  const hash = window.location.hash || '#dashboard';
  
  // Parse nested route (e.g. #registrations/pilots)
  const parts = hash.replace('#', '').split('/');
  const mainRoute = parts[0] || 'dashboard';
  const subRoute = parts[1] || null;
  
  // Save sub-routes for session memory
  if (mainRoute === 'settings' && subRoute) {
    lastSettingsSubRoute = subRoute;
  }
  if (mainRoute === 'registrations' && subRoute) {
    lastRegistrationsSubRoute = subRoute;
  }

  // Redirect to default child route if registrations is accessed without sub-route
  if (mainRoute === 'registrations' && !subRoute) {
    window.location.hash = `#registrations/${lastRegistrationsSubRoute}`;
    return;
  }
  
  // Redirect to default child route if settings is accessed without sub-route
  if (mainRoute === 'settings' && !subRoute) {
    window.location.hash = `#settings/${lastSettingsSubRoute}`;
    return;
  }
  
  // Toggle visibility of top-level views
  const views = document.querySelectorAll('.view-section');
  let viewFound = false;

  views.forEach(view => {
    if (view.id === `view-${mainRoute}`) {
      view.classList.remove('d-none');
      viewFound = true;
    } else {
      view.classList.add('d-none');
    }
  });

  // Fallback to dashboard view if route doesn't exist
  if (!viewFound) {
    const dashboardView = document.getElementById('view-dashboard');
    if (dashboardView) dashboardView.classList.remove('d-none');
  }

  // Update active status in the Header Navbar Links
  const navDashboard = document.getElementById('nav-dashboard');
  const navRegistrations = document.getElementById('nav-registrations');
  const navSettings = document.getElementById('nav-settings');

  if (navDashboard && navRegistrations && navSettings) {
    // Reset all active classes
    navDashboard.classList.remove('active');
    navRegistrations.classList.remove('active');
    navSettings.classList.remove('active');
    
    // Set active link based on current main route
    if (mainRoute === 'settings') {
      navSettings.classList.add('active');
    } else if (mainRoute === 'registrations') {
      navRegistrations.classList.add('active');
    } else {
      navDashboard.classList.add('active');
    }
  }

  // If in registrations, delegate the child route change to the custom element
  if (mainRoute === 'registrations') {
    const registrationsElement = document.querySelector('slotrace-registrations');
    if (registrationsElement && typeof registrationsElement.updateSubRoute === 'function') {
      registrationsElement.updateSubRoute(subRoute);
    }
  }

  // If in settings, delegate the child route change to the custom element
  if (mainRoute === 'settings') {
    const settingsElement = document.querySelector('slotrace-settings');
    if (settingsElement && typeof settingsElement.updateSubRoute === 'function') {
      settingsElement.updateSubRoute(subRoute);
    }
  }
}

// Listen for routing changes
window.addEventListener('hashchange', handleRoute);

// Initialize application on load
window.addEventListener('DOMContentLoaded', () => {
  // Restore saved primary color and dark/light theme on startup from Node.js database
  window.electronAPI.db.get('settings').then(settings => {
    if (settings) {
      if (settings.main_color) {
        window.applyMainColor(settings.main_color);
      }
      if (settings.theme) {
        window.applyTheme(settings.theme);
      }
      if (settings.language) {
        window.currentLanguage = settings.language;
      }
      // Broadcast language change to update all rendered components
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: window.currentLanguage }));
    }
  }).catch(err => {
    console.error('Failed to load theme configuration on startup:', err);
  });

  handleRoute();
});
