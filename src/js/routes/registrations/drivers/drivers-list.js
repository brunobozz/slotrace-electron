class SlotRaceRegistrationsDriversList extends HTMLElement {
  connectedCallback() {
    this.drivers = [];
    this.filterQuery = "";

    // Load drivers on connect
    this.loadDrivers();

    this._langListener = () => this.render();
    this._addedListener = () => this.loadDrivers();
    this._filterListener = (e) => {
      this.filterQuery = e.detail.query;
      this.render();
    };

    window.addEventListener("languageChanged", this._langListener);
    window.addEventListener("driverAdded", this._addedListener);
    window.addEventListener("driverFilterChanged", this._filterListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
    if (this._addedListener) {
      window.removeEventListener("driverAdded", this._addedListener);
    }
    if (this._filterListener) {
      window.removeEventListener("driverFilterChanged", this._filterListener);
    }
  }

  loadDrivers() {
    window.electronAPI.db
      .get("drivers")
      .then((drivers) => {
        this.drivers = (drivers || []).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
        this.render();
      })
      .catch((err) => {
        console.error("Failed to load drivers for list:", err);
      });
  }

  render() {
    if (this.drivers.length === 0) {
      this.innerHTML = `
        <div class="py-5 text-center fade-in">
          <i class="mdi mdi-account-multiple-outline text-secondary fs-2 mb-3 d-block"></i>
          <h6 class="fw-bold text-body-emphasis mb-0">${window.t("registrations.no_drivers_listed")}</h6>
        </div>
      `;
      return;
    }

    let filtered = this.drivers;
    if (this.filterQuery && this.filterQuery.trim()) {
      const q = this.filterQuery.toLowerCase().trim();
      filtered = this.drivers.filter((driver) => {
        const name = (driver.name || "").toLowerCase();
        const nickname = (driver.nickname || "").toLowerCase();
        return name.includes(q) || nickname.includes(q);
      });
    }

    if (filtered.length === 0) {
      this.innerHTML = `
        <div class="py-5 text-center fade-in">
          <i class="mdi mdi-magnify-close text-secondary fs-1 mb-3 d-block text-center"></i>
          <h5 class="fw-bold text-body-emphasis mb-0 text-center">${window.t("registrations.no_drivers_found")}</h5>
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <div class="row" id="drivers-grid-container"></div>
    `;

    const container = this.querySelector("#drivers-grid-container");
    filtered.forEach((driver) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-12 col-lg-6 col-xxl-4 mb-4 fade-in";

      const card = document.createElement("slotrace-registrations-drivers-card");
      card.className = "d-block h-100";
      card.driver = driver;

      col.appendChild(card);
      container.appendChild(col);
    });
  }
}

// Define the custom element <slotrace-registrations-drivers-list>
customElements.define(
  "slotrace-registrations-drivers-list",
  SlotRaceRegistrationsDriversList,
);
