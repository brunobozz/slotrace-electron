class SlotRaceHeader extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'description'];
  }

  attributeChangedCallback() {
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const title = this.getAttribute('title') || '';
    const description = this.getAttribute('description') || '';
    
    this.innerHTML = `
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="h2 fw-bold text-body-emphasis mb-1">${title}</h1>
          <p class="text-secondary mb-0">${description}</p>
        </div>
      </div>
    `;
  }
}

// Define the custom element <slotrace-header>
customElements.define('slotrace-header', SlotRaceHeader);
