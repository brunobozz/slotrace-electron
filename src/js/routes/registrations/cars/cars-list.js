class SlotRaceRegistrationsCarsList extends HTMLElement {
  connectedCallback() {
    this.cars = [];
    this.drivers = [];
    this.filterQuery = "";

    this.loadCars();

    this._langListener = () => this.render();
    this._addedListener = () => this.loadCars();
    this._filterListener = (e) => {
      this.filterQuery = e.detail.query;
      this.render();
    };

    window.addEventListener("languageChanged", this._langListener);
    window.addEventListener("carAdded", this._addedListener);
    window.addEventListener("driverAdded", this._addedListener);
    window.addEventListener("carFilterChanged", this._filterListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
    if (this._addedListener) {
      window.removeEventListener("carAdded", this._addedListener);
      window.removeEventListener("driverAdded", this._addedListener);
    }
    if (this._filterListener) {
      window.removeEventListener("carFilterChanged", this._filterListener);
    }
  }

  loadCars() {
    Promise.all([
      window.electronAPI.db.get("cars"),
      window.electronAPI.db.get("drivers"),
    ])
      .then(([cars, drivers]) => {
        this.cars = (cars || []).sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", undefined, {
            sensitivity: "base",
          }),
        );
        this.drivers = drivers || [];
        this.render();
      })
      .catch((err) => {
        console.error("Failed to load cars and drivers lists:", err);
      });
  }

  render() {
    if (this.cars.length === 0) {
      this.innerHTML = `
        <div class="py-5 text-center fade-in">
          <i class="mdi mdi-car-multiple text-secondary fs-2 mb-3 d-block"></i>
          <h6 class="fw-bold text-body-emphasis mb-0">${window.t("registrations.no_cars_listed") || "Nenhum carro cadastrado ainda."}</h6>
        </div>
      `;
      return;
    }

    let filtered = this.cars;
    if (this.filterQuery && this.filterQuery.trim()) {
      const q = this.filterQuery.toLowerCase().trim();
      filtered = this.cars.filter((car) => {
        const name = (car.name || "").toLowerCase();
        const manufacturer = (
          car.manufacturer ||
          car.brand ||
          ""
        ).toLowerCase();
        return name.includes(q) || manufacturer.includes(q);
      });
    }

    if (filtered.length === 0) {
      this.innerHTML = `
        <div class="py-5 text-center fade-in">
          <i class="mdi mdi-magnify-close text-secondary fs-1 mb-3 d-block text-center"></i>
          <h5 class="fw-bold text-body-emphasis mb-0 text-center">${window.t("registrations.no_cars_found") || "Nenhum carro encontrado para esta pesquisa."}</h5>
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <div class="row" id="cars-grid-container"></div>
    `;

    const container = this.querySelector('#cars-grid-container');
    filtered.forEach(car => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-12 col-lg-6 col-xxl-4 mb-4 fade-in';

      const card = document.createElement('slotrace-registrations-cars-card');
      card.className = 'd-block h-100';
      card.car = car;
      card.drivers = this.drivers;

      col.appendChild(card);
      container.appendChild(col);
    });
  }
}

customElements.define(
  "slotrace-registrations-cars-list",
  SlotRaceRegistrationsCarsList,
);
