class SlotRaceRegistrationsTracks extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <!-- Toolbar Component (Search + Add) -->
      <slotrace-registrations-tracks-toolbar class="d-block mb-3"></slotrace-registrations-tracks-toolbar>

      <!-- Tracks List Grid -->
      <slotrace-registrations-tracks-list class="mt-4 d-block"></slotrace-registrations-tracks-list>

      <!-- Delete Track Confirmation Modal -->
      <slotrace-registrations-tracks-delete-modal></slotrace-registrations-tracks-delete-modal>

      <!-- Track Creation Modal Component -->
      <slotrace-registrations-tracks-create-modal></slotrace-registrations-tracks-create-modal>
    `;
  }
}

// Define the custom element <slotrace-registrations-tracks>
customElements.define('slotrace-registrations-tracks', SlotRaceRegistrationsTracks);
