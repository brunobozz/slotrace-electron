class SlotRaceNavbar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <nav class="navbar navbar-expand-lg border-bottom border-secondary-subtle bg-body-tertiary">
        <div class="container-fluid px-4 position-relative">
          <a class="navbar-brand d-flex align-items-center gap-2" href="#">
            <span class="fs-4 fw-bold text-uppercase text-danger">Slot<span class="text-body-emphasis">Race</span></span>
          </a>
          
          <!-- Center Local Name -->
          <div id="navbar-local-name-wrapper" class="position-absolute start-50 translate-middle-x d-none d-md-block text-body-emphasis fs-5 fw-semibold text-center"></div>
          
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <slotrace-navbar-menu class="ms-auto"></slotrace-navbar-menu>
          </div>
        </div>
      </nav>
    `;

    // Fetch the local name asynchronously from the Node.js database
    window.electronAPI.db.get('settings').then(settings => {
      const name = (settings && settings.local_name) || '';
      const wrapper = this.querySelector('#navbar-local-name-wrapper');
      if (wrapper) {
        wrapper.textContent = name;
      }
    }).catch(err => {
      console.error('Failed to load local name from database:', err);
    });

    // Listen to localNameChanged event to update navbar dynamically
    this._listener = (e) => {
      const name = e.detail || '';
      const wrapper = this.querySelector('#navbar-local-name-wrapper');
      if (wrapper) {
        wrapper.textContent = name;
      }
    };
    window.addEventListener('localNameChanged', this._listener);
  }

  disconnectedCallback() {
    if (this._listener) {
      window.removeEventListener('localNameChanged', this._listener);
    }
  }
}

// Define the new custom element <slotrace-navbar>
customElements.define('slotrace-navbar', SlotRaceNavbar);
