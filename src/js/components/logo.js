class SlotRaceLogo extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <span class="fs-4 fw-bold text-uppercase text-primary">Slot<span class="text-body-emphasis">Race</span></span>
    `;
  }
}
customElements.define('slotrace-logo', SlotRaceLogo);
