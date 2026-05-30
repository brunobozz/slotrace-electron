class SlotRaceRegistrationsTab extends HTMLElement {
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
      <ul class="nav nav-tabs border-secondary-subtle mb-4" id="registrations-tabs" role="tablist">
        <li class="nav-item" role="presentation">
          <a class="nav-link d-flex align-items-center gap-2" id="subnav-drivers" href="#registrations/drivers" role="tab">
            <i class="mdi mdi-account-multiple fs-5"></i>
            <span>${window.t('registrations.drivers')}</span>
          </a>
        </li>
        <li class="nav-item" role="presentation">
          <a class="nav-link d-flex align-items-center gap-2" id="subnav-cars" href="#registrations/cars" role="tab">
            <i class="mdi mdi-car-sports fs-5"></i>
            <span>${window.t('registrations.cars')}</span>
          </a>
        </li>
        <li class="nav-item" role="presentation">
          <a class="nav-link d-flex align-items-center gap-2" id="subnav-tracks" href="#registrations/tracks" role="tab">
            <i class="mdi mdi-flag-checkered fs-5"></i>
            <span>${window.t('registrations.tracks')}</span>
          </a>
        </li>
      </ul>
    `;
    
    // Restore active states based on current route
    const hash = window.location.hash || '';
    const parts = hash.replace('#', '').split('/');
    const activeSubRoute = (parts[0] === 'registrations' && parts[1]) ? parts[1] : 'drivers';
    
    const subnavDrivers = this.querySelector('#subnav-drivers');
    const subnavCars = this.querySelector('#subnav-cars');
    const subnavTracks = this.querySelector('#subnav-tracks');
    
    if (subnavDrivers && subnavCars && subnavTracks) {
      subnavDrivers.classList.remove('active');
      subnavCars.classList.remove('active');
      subnavTracks.classList.remove('active');
      
      if (activeSubRoute === 'cars') {
        subnavCars.classList.add('active');
      } else if (activeSubRoute === 'tracks') {
        subnavTracks.classList.add('active');
      } else {
        subnavDrivers.classList.add('active');
      }
    }
  }
}

// Define the custom element <slotrace-registrations-tab>
customElements.define('slotrace-registrations-tab', SlotRaceRegistrationsTab);
