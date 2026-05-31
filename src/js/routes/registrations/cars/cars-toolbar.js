class SlotRaceRegistrationsCarsToolbar extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupEvents();

    this._langListener = () => {
      const searchVal = this.querySelector("#input-car-search")?.value || "";
      this.render();
      this.setupEvents();
      const input = this.querySelector("#input-car-search");
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
        <div class="d-flex align-items-center form-control form-control-lg search-wrapper-cardless border border-secondary-subtle rounded" style="max-width: 300px; width: 100%; background-color: #111111">
          <span class="bg-transparent border-0 pe-1 ps-1">
            <i class="mdi mdi-magnify fs-5 text-white"></i>
          </span>
          <input type="text" id="input-car-search" class="form-control form-control-lg bg-transparent border-0 text-body-emphasis ps-1 pe-3 py-2 flex-grow-1" placeholder="${window.t("registrations.search_car_placeholder") || "Pesquisar carro..."}" style="outline: none; box-shadow: none; border: 0px !important;">
        </div>

        <!-- Action Button Right -->
        <button id="btn-new-car" class="btn btn-lg btn-primary px-3 fw-semibold d-flex align-items-center gap-2">
          <i class="mdi mdi-plus-circle-outline fs-5"></i>
          ${window.t("registrations.new_car") || "Novo Carro"}
        </button>
      </div>
    `;
  }

  setupEvents() {
    const input = this.querySelector("#input-car-search");
    const btnNew = this.querySelector("#btn-new-car");

    if (input) {
      let debounceTimeout;
      input.addEventListener("input", (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("carFilterChanged", {
              detail: { query: e.target.value },
            }),
          );
        }, 1000);
      });
    }

    if (btnNew) {
      btnNew.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("requestCreateCar"));
      });
    }
  }
}

customElements.define(
  "slotrace-registrations-cars-toolbar",
  SlotRaceRegistrationsCarsToolbar,
);
