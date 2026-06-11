class SlotRaceSidebar extends HTMLElement {
  connectedCallback() {
    this._localName = "";
    this._localLogo = "";
    this.render();

    // Fetch local name and logo asynchronously from the Node.js database
    window.electronAPI.db
      .get("settings")
      .then((settings) => {
        if (settings) {
          this._localName = settings.local_name || "";
          this._localLogo = settings.local_logo || "";
          this._updateHeaderVisibility();
        }
      })
      .catch((err) => {
        console.error("Failed to load local settings from database:", err);
      });

    // Listen to localNameChanged event to update sidebar dynamically
    this._nameListener = (e) => {
      this._localName = e.detail || "";
      this._updateHeaderVisibility();
    };
    window.addEventListener("localNameChanged", this._nameListener);

    // Listen to localLogoChanged event to update sidebar dynamically
    this._logoListener = (e) => {
      this._localLogo = e.detail || "";
      this._updateHeaderVisibility();
    };
    window.addEventListener("localLogoChanged", this._logoListener);
  }

  disconnectedCallback() {
    if (this._nameListener) {
      window.removeEventListener("localNameChanged", this._nameListener);
    }
    if (this._logoListener) {
      window.removeEventListener("localLogoChanged", this._logoListener);
    }
  }

  _updateHeaderVisibility() {
    const header = this.querySelector("#sidebar-club-header");
    const nameWrapper = this.querySelector("#sidebar-local-name");

    if (nameWrapper) {
      nameWrapper.textContent = this._localName;
      nameWrapper.style.display = this._localName ? "block" : "none";
    }

    if (header) {
      if (this._localName || this._localLogo) {
        header.classList.remove("d-none");
      } else {
        header.classList.add("d-none");
      }
    }
  }

  render() {
    this.innerHTML = `
      <aside class="d-flex flex-column align-items-stretch flex-shrink-0 text-white bg-body-tertiary border-end border-secondary-subtle h-100 p-4" style="width: 300px;">
        <!-- Top: Logo & Club Header (hidden by default) -->
        <div id="sidebar-club-header" class="d-flex flex-column align-items-center text-center mb-4 d-none">
          <slotrace-club-logo class="w-100"></slotrace-club-logo>
          <!-- Local Name Subtitle -->
          <div id="sidebar-local-name" class="text-secondary small fw-semibold mt-1 px-1 text-uppercase tracking-wider" style="font-size: 0.75rem; letter-spacing: 0.05em; display: none;"></div>
        </div>

        <!-- Middle: Sidebar Menu -->
        <div class="flex-grow-1 overflow-y-auto">
          <slotrace-sidebar-menu></slotrace-sidebar-menu>
        </div>

        <!-- Bottom: Footer -->
        <div class="d-flex justify-content-center">
          <slotrace-logo></slotrace-logo>
        </div>
        <div class="mt-auto border-top border-secondary-subtle pt-3 d-flex flex-column align-items-center gap-2">
          <slotrace-navbar-footer></slotrace-navbar-footer>
        </div>
      </aside>
    `;
  }
}

customElements.define("slotrace-sidebar", SlotRaceSidebar);
