class SlotRaceRegistrationsDrivers extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <!-- Toolbar Component (Search + Add) -->
      <slotrace-registrations-drivers-toolbar class="d-block mb-3"></slotrace-registrations-drivers-toolbar>

      <!-- Drivers List Grid -->
      <slotrace-registrations-drivers-list class="mt-4 d-block"></slotrace-registrations-drivers-list>

      <!-- Delete Driver Confirmation Modal -->
      <slotrace-registrations-drivers-delete-modal></slotrace-registrations-drivers-delete-modal>

      <!-- Driver Creation Modal Component -->
      <slotrace-registrations-drivers-create-modal></slotrace-registrations-drivers-create-modal>
    `;
  }
}

// Define the custom element <slotrace-registrations-drivers>
customElements.define('slotrace-registrations-drivers', SlotRaceRegistrationsDrivers);
