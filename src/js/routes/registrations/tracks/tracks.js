class SlotRaceRegistrationsTracks extends HTMLElement {
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
      <div class="d-flex justify-content-end mb-3">
        <button class="btn btn-primary px-3 fw-semibold d-flex align-items-center gap-2">
          <i class="mdi mdi-plus-circle-outline fs-5"></i>
          ${window.t('registrations.new_track')}
        </button>
      </div>
    `;
  }
}

// Define the custom element <slotrace-registrations-tracks>
customElements.define('slotrace-registrations-tracks', SlotRaceRegistrationsTracks);
