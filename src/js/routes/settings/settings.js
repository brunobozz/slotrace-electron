class SlotRaceSettings extends HTMLElement {
  connectedCallback() {
    this._activeSubRoute = 'informations'; // default
    
    // Parse nested route from current hash to restore correct state initially
    const hash = window.location.hash || '';
    const parts = hash.replace('#', '').split('/');
    if (parts[0] === 'settings' && parts[1]) {
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
        <slotrace-header title="${window.t('settings.title')}" description="${window.t('settings.desc')}"></slotrace-header>
        
        <div class="row g-4">
          <!-- Sidebar (Left Column) -->
          <div class="col-md-3">
            <slotrace-settings-menu></slotrace-settings-menu>
          </div>
          
          <!-- Content (Right Column) -->
          <div class="col-md-9">
            <!-- Informations Sub-view -->
            <div id="subview-informations" class="subview-section fade-in">
              <slotrace-settings-informations></slotrace-settings-informations>
            </div>
            
            <!-- Preferences Sub-view -->
            <div id="subview-preferences" class="subview-section d-none fade-in">
              <slotrace-settings-preferences></slotrace-settings-preferences>
            </div>

            <!-- Language and Audio Sub-view -->
            <div id="subview-language-audio" class="subview-section d-none fade-in">
              <slotrace-settings-language-audio></slotrace-settings-language-audio>
            </div>
            
            <!-- Connections Sub-view -->
            <div id="subview-connections" class="subview-section d-none fade-in">
              <slotrace-settings-connections></slotrace-settings-connections>
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
    this._activeSubRoute = subRoute || 'informations';
    const subviews = this.querySelectorAll('.subview-section');
    
    // Toggle active nested view visibility
    subviews.forEach(view => {
      if (view.id === `subview-${this._activeSubRoute}`) {
        view.classList.remove('d-none');
      } else {
        view.classList.add('d-none');
      }
    });

    // Update active sidebar nav link inside the settings-menu component
    const menuComponent = this.querySelector('slotrace-settings-menu');
    if (menuComponent) {
      menuComponent.querySelectorAll('.nav-link').forEach(link => {
        if (link.id && link.id.startsWith('subnav-')) {
          link.classList.remove('active');
        }
      });
      
      const activeLink = menuComponent.querySelector(`#subnav-${this._activeSubRoute}`);
      if (activeLink) {
        activeLink.classList.add('active');
      }
    }
  }
}

// Define the custom element <slotrace-settings>
customElements.define('slotrace-settings', SlotRaceSettings);
