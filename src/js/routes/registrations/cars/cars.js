class SlotRaceRegistrationsCars extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <!-- Toolbar Component (Search + Add) -->
      <slotrace-registrations-cars-toolbar class="d-block mb-3"></slotrace-registrations-cars-toolbar>

      <!-- Cars List Grid -->
      <slotrace-registrations-cars-list class="mt-4 d-block"></slotrace-registrations-cars-list>

      <!-- Delete Car Confirmation Modal -->
      <slotrace-registrations-cars-delete-modal></slotrace-registrations-cars-delete-modal>

      <!-- Car Creation Modal Component -->
      <slotrace-registrations-cars-create-modal></slotrace-registrations-cars-create-modal>
    `;
  }
}

// Define the custom element <slotrace-registrations-cars>
customElements.define('slotrace-registrations-cars', SlotRaceRegistrationsCars);
