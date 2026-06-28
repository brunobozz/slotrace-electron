class SlotRaceRegistrations extends HTMLElement {
  connectedCallback() {
    this._activeSubRoute = "drivers"; // default

    // Parse nested route from current hash to restore correct state initially
    const hash = window.location.hash || "";
    const parts = hash.replace("#", "").split("/");
    if (parts[0] === "registrations" && parts[1]) {
      this._activeSubRoute = parts[1];
    }

    this.render();

    this._langListener = () => {
      this.render();
    };
    window.addEventListener("languageChanged", this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
  }

  render() {
    this.innerHTML = `
      <div class="container fade-in">
        <!-- Tabs Navigation -->
        <ul class="nav nav-tabs nav-fill border-secondary-subtle mb-4">
          <li class="nav-item">
            <a class="nav-link px-4 py-2 fw-semibold text-secondary-emphasis d-flex align-items-center justify-content-center gap-2" id="tab-drivers" href="#registrations/drivers">
              <i class="mdi mdi-account-outline fs-5"></i>
              <span>${window.t('registrations.drivers')}</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link px-4 py-2 fw-semibold text-secondary-emphasis d-flex align-items-center justify-content-center gap-2" id="tab-cars" href="#registrations/cars">
              <i class="mdi mdi-car-sports fs-5"></i>
              <span>${window.t('registrations.cars')}</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link px-4 py-2 fw-semibold text-secondary-emphasis d-flex align-items-center justify-content-center gap-2" id="tab-tracks" href="#registrations/tracks">
              <i class="mdi mdi-go-kart-track fs-5"></i>
              <span>${window.t('registrations.tracks')}</span>
            </a>
          </li>
        </ul>

        <!-- Sub-views Container -->
        <div>
          <!-- Drivers Sub-view -->
          <div id="subview-drivers" class="subview-section fade-in">
            <slotrace-registrations-drivers></slotrace-registrations-drivers>
          </div>
          
          <!-- Cars Sub-view -->
          <div id="subview-cars" class="subview-section d-none fade-in">
            <slotrace-registrations-cars></slotrace-registrations-cars>
          </div>
          
          <!-- Tracks Sub-view -->
          <div id="subview-tracks" class="subview-section d-none fade-in">
            <slotrace-registrations-tracks></slotrace-registrations-tracks>
          </div>
        </div>
      </div>
    `;

    // Apply visibility states
    this.updateSubRoute(this._activeSubRoute);
  }

  updateSubRoute(subRoute) {
    this._activeSubRoute = subRoute || "drivers";
    if (this._activeSubRoute === "races") {
      this._activeSubRoute = "drivers";
    }
    const subviews = this.querySelectorAll(".subview-section");

    // Toggle active nested view visibility
    subviews.forEach((view) => {
      if (view.id === `subview-${this._activeSubRoute}`) {
        view.classList.remove("d-none");
      } else {
        view.classList.add("d-none");
      }
    });

    // Update active tab link state
    this.querySelectorAll(".nav-link").forEach((link) => {
      if (link.id && link.id.startsWith("tab-")) {
        link.classList.remove("active");
      }
    });

    const activeTab = this.querySelector(`#tab-${this._activeSubRoute}`);
    if (activeTab) {
      activeTab.classList.add("active");
    }
  }
}

// Define the custom element <slotrace-registrations>
customElements.define("slotrace-registrations", SlotRaceRegistrations);
