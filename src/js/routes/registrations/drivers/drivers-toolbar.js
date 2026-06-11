class SlotRaceRegistrationsDriversToolbar extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupEvents();

    this._langListener = () => {
      const searchVal = this.querySelector("#driver-search")?.value || "";
      this.render();
      this.setupEvents();
      const input = this.querySelector("#driver-search");
      if (input) {
        input.value = searchVal;
      }
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
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <!-- Search Input Left -->
        <slotrace-search-input id="driver-search" placeholder-key="registrations.search_placeholder" filter-event="driverFilterChanged" style="width: 100%; max-width: 300px;"></slotrace-search-input>

        <!-- Action Button Right -->
        <button id="btn-new-driver" class="btn btn-lg btn-primary px-3 fw-semibold d-flex align-items-center gap-2">
          <i class="mdi mdi-plus-circle-outline fs-5"></i>
          ${window.t("registrations.new_driver") || "Novo Piloto"}
        </button>
      </div>
    `;
  }

  setupEvents() {
    const btnNew = this.querySelector("#btn-new-driver");

    if (btnNew) {
      btnNew.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("requestCreateDriver"));
      });
    }
  }
}

customElements.define(
  "slotrace-registrations-drivers-toolbar",
  SlotRaceRegistrationsDriversToolbar,
);
