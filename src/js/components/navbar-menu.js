class SlotRaceNavbarMenu extends HTMLElement {
  connectedCallback() {
    this.render();
    
    this._langListener = () => this.render();
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  render() {
    this.innerHTML = `
      <ul class="navbar-nav ms-auto align-items-center">
        <li class="nav-item me-2 me-lg-3">
          <a class="btn btn-primary btn-sm px-3 fw-semibold d-flex align-items-center gap-1" id="nav-race" href="#race">
            <i class="mdi mdi-flag-checkered"></i>
            ${window.t('navbar.race') || 'Race'}
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" id="nav-dashboard" href="#dashboard">${window.t('navbar.dashboard')}</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" id="nav-registrations" href="#registrations">${window.t('navbar.registrations')}</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" id="nav-settings" href="#settings">${window.t('navbar.settings')}</a>
        </li>
      </ul>
    `;
    
    // Restore active states based on current route
    const hash = window.location.hash || '#dashboard';
    const parts = hash.replace('#', '').split('/');
    const mainRoute = parts[0] || 'dashboard';
    
    const navRace = this.querySelector('#nav-race');
    const navDashboard = this.querySelector('#nav-dashboard');
    const navRegistrations = this.querySelector('#nav-registrations');
    const navSettings = this.querySelector('#nav-settings');
    
    if (navRace && navDashboard && navRegistrations && navSettings) {
      navRace.classList.remove('active');
      navDashboard.classList.remove('active');
      navRegistrations.classList.remove('active');
      navSettings.classList.remove('active');
      
      if (mainRoute === 'race') {
        navRace.classList.add('active');
      } else if (mainRoute === 'settings') {
        navSettings.classList.add('active');
      } else if (mainRoute === 'registrations') {
        navRegistrations.classList.add('active');
      } else {
        navDashboard.classList.add('active');
      }
    }
  }
}

// Define the new custom element <slotrace-navbar-menu>
customElements.define('slotrace-navbar-menu', SlotRaceNavbarMenu);
