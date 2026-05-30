class SlotRaceRegistrations extends HTMLElement {
  connectedCallback() {
    this._activeSubRoute = 'drivers'; // default
    
    // Parse nested route from current hash to restore correct state initially
    const hash = window.location.hash || '';
    const parts = hash.replace('#', '').split('/');
    if (parts[0] === 'registrations' && parts[1]) {
      this._activeSubRoute = parts[1];
    }
    
    this.render();
    
    this._langListener = () => {
      this.render();
    };
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  render() {
    this.innerHTML = `
      <div class="container py-4 fade-in">
        <!-- Route Header -->
        <slotrace-header title="${window.t('registrations.title')}" description="${window.t('registrations.desc')}"></slotrace-header>

        <!-- Navigation Tabs (Top) -->
        <div class="row">
          <div class="col-12">
            <slotrace-registrations-tab></slotrace-registrations-tab>
          </div>
        </div>

        <!-- Active View Content -->
        <div class="row">
          <div class="col-12">
            <!-- Drivers Sub-view -->
            <div id="subview-drivers" class="subview-section fade-in">
              <slotrace-registrations-drivers></slotrace-registrations-drivers>
            </div>
            
            <!-- Cars Sub-view -->
            <div id="subview-cars" class="subview-section d-none fade-in">
              <slotrace-registrations-cars></slotrace-registrations-cars>
            </div>
            
            <!-- Tracks Sub-view -->
            <div id="subview-tracks" class="subview-section d-none fade-in">
              <slotrace-registrations-tracks></slotrace-registrations-tracks>
            </div>
          </div>
        </div>
      </div>
    `;

    // Apply visibility states
    this.updateSubRoute(this._activeSubRoute);
  }

  // Method called to switch between internal subviews
  updateSubRoute(subRoute) {
    this._activeSubRoute = subRoute || 'drivers';
    const subviews = this.querySelectorAll('.subview-section');
    
    // Toggle active nested view visibility
    subviews.forEach(view => {
      if (view.id === `subview-${this._activeSubRoute}`) {
        view.classList.remove('d-none');
      } else {
        view.classList.add('d-none');
      }
    });

    // Update active sidebar nav link inside the registrations-tab component
    const tabComponent = this.querySelector('slotrace-registrations-tab');
    if (tabComponent) {
      tabComponent.querySelectorAll('.nav-link').forEach(link => {
        if (link.id && link.id.startsWith('subnav-')) {
          link.classList.remove('active');
        }
      });
      
      const activeLink = tabComponent.querySelector(`#subnav-${this._activeSubRoute}`);
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }
  }
}

// Define the custom element <slotrace-registrations>
customElements.define('slotrace-registrations', SlotRaceRegistrations);
