class SlotRaceSidebar extends HTMLElement {
  connectedCallback() {
    this.render();

    // Fetch the local name asynchronously from the Node.js database
    window.electronAPI.db
      .get("settings")
      .then((settings) => {
        const name = (settings && settings.local_name) || "";
        const wrapper = this.querySelector("#sidebar-local-name");
        if (wrapper) {
          wrapper.textContent = name;
        }
      })
      .catch((err) => {
        console.error("Failed to load local name from database:", err);
      });

    // Listen to localNameChanged event to update sidebar dynamically
    this._listener = (e) => {
      const name = e.detail || "";
      const wrapper = this.querySelector("#sidebar-local-name");
      if (wrapper) {
        wrapper.textContent = name;
      }
    };
    window.addEventListener("localNameChanged", this._listener);
  }

  disconnectedCallback() {
    if (this._listener) {
      window.removeEventListener("localNameChanged", this._listener);
    }
  }

  render() {
    this.innerHTML = `
      <aside class="d-flex flex-column align-items-stretch flex-shrink-0 text-white bg-body-tertiary border-end border-secondary-subtle h-100 p-4" style="width: 260px;">
        <!-- Top: Logo -->
        <div class="d-flex flex-column mb-4">
          <slotrace-logo></slotrace-logo>
          <!-- Local Name Subtitle -->
          <div id="sidebar-local-name" class="text-secondary small fw-semibold mt-1 px-1 text-uppercase tracking-wider" style="font-size: 0.75rem; letter-spacing: 0.05em;"></div>
        </div>

        <!-- Middle: Sidebar Menu -->
        <div class="flex-grow-1 overflow-y-auto">
          <slotrace-sidebar-menu></slotrace-sidebar-menu>
        </div>

        <!-- Bottom: Footer -->
        <div class="mt-auto border-top border-secondary-subtle pt-3">
          <slotrace-navbar-footer></slotrace-navbar-footer>
        </div>
      </aside>
    `;
  }
}

customElements.define("slotrace-sidebar", SlotRaceSidebar);
