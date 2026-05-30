class SlotRaceSettingsHeader extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'icon'];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const title = this.getAttribute('title') || '';
    const icon = this.getAttribute('icon') || '';
    
    this.innerHTML = `
      <div class="d-flex align-items-center gap-2 mb-3">
        <i class="mdi ${icon} text-danger fs-3"></i>
        <h3 class="h4 fw-bold text-body-emphasis mb-0">${title}</h3>
      </div>
      <hr class="my-3 border-secondary-subtle">
    `;
  }
}

// Define the custom element <slotrace-settings-header>
customElements.define('slotrace-settings-header', SlotRaceSettingsHeader);
