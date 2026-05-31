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

    let cardsHtml = "";
    filtered.forEach((car) => {
      const name = car.name || "";
      const manufacturer = car.manufacturer || car.brand || "";
      const scale = car.scale || "";
      const photoUrl = car.photo || "";

      const ownerDriver = this.drivers.find((d) => d.id === car.ownerId);
      const ownerName = ownerDriver
        ? ownerDriver.nickname || ownerDriver.name
        : "";

      cardsHtml += `
        <div class="col-12 col-md-12 col-lg-6 col-xxl-4 mb-4 fade-in">
          <div class="card h-100 bg-body-tertiary border-secondary-subtle shadow-sm transition-hover">
            <div class="card-body p-3 d-flex flex-column">
              
              <!-- 16:9 Landscape Car Image -->
              <div class="rounded-3 border border-secondary-subtle shadow-sm overflow-hidden bg-body-secondary mb-3 w-100 position-relative" style="aspect-ratio: 16/9;">
                ${
                  photoUrl
                    ? `
                  <img src="${photoUrl}" class="w-100 h-100 object-fit-cover">
                `
                    : `
                  <div class="w-100 h-100 d-flex align-items-center justify-content-center">
                    <i class="mdi mdi-car-sports text-secondary" style="font-size: 56px; line-height: 1;"></i>
                  </div>
                `
                }
              </div>
              
              <!-- Upper row: Model name & Scale badge side-by-side -->
              <div class="d-flex align-items-center justify-content-between mb-2 gap-2">
                <h4 class="fw-bold text-body-emphasis mb-0 text-truncate text-start" title="${name}" style="font-size: 1.25rem; line-height: 1.2;">
                  ${name}
                </h4>
                ${
                  scale
                    ? `
                  <div class="badge border border-secondary-subtle text-secondary px-2 py-1 flex-shrink-0" style="font-size: 0.75rem; font-weight: 600; background: rgba(0, 0, 0, 0.15);">
                    ${scale}
                  </div>
                `
                    : ""
                }
              </div>
              
              <!-- Thin divider line -->
              <hr class="my-2 border-secondary-subtle opacity-25">
              
              <!-- Bottom Row: Metadata details + Edit/Delete actions -->
              <div class="d-flex align-items-end justify-content-between mt-auto pt-1">
                <div class="text-start overflow-hidden">
                  <div class="small text-secondary text-truncate" style="font-size: 0.8rem;" title="${manufacturer || "-"}">
                    ${window.t("registrations.cars_modal.manufacturer_label") || "Fabricante"}: <strong class="text-body-emphasis">${manufacturer || "-"}</strong>
                  </div>
                  <div class="small text-secondary mt-1 text-truncate" style="font-size: 0.8rem;" title="${ownerName || window.t("registrations.cars_modal.no_owner") || "Sem proprietário"}">
                    ${window.t("registrations.cars_modal.owner_label") || "Proprietário"}: <strong style="color: var(--bs-primary); font-weight: bold;">${ownerName || window.t("registrations.cars_modal.no_owner") || "Sem proprietário"}</strong>
                  </div>
                </div>
                
                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                  <span class="fs-5 hover-scale-btn btn-edit-car" style="cursor: pointer; color: var(--bs-primary);" data-id="${car.id}" title="${window.t("registrations.cars_modal.edit_button") || "Editar"}">
                    <i class="mdi mdi-pencil-outline"></i>
                  </span>
                  <span class="fs-5 hover-scale-btn text-danger ms-1 btn-delete-car" style="cursor: pointer;" data-id="${car.id}" data-name="${name}" title="${window.t("registrations.cars_modal.delete_button") || "Excluir"}">
                    <i class="mdi mdi-trash-can-outline"></i>
                  </span>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      `;
    });

    this.innerHTML = `
      <div class="row">
        ${cardsHtml}
      </div>
    `;

    // Bind delete confirmation request events
    this.querySelectorAll(".btn-delete-car").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const name = btn.getAttribute("data-name");
        window.dispatchEvent(
          new CustomEvent("requestDeleteCar", {
            detail: { id, name },
          }),
        );
      });
    });

    // Bind edit request events
    this.querySelectorAll(".btn-edit-car").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const car = this.cars.find((c) => c.id === id);
        if (car) {
          window.dispatchEvent(
            new CustomEvent("requestEditCar", {
              detail: { car },
            }),
          );
        }
      });
    });
  }
}

customElements.define(
  "slotrace-registrations-cars-list",
  SlotRaceRegistrationsCarsList,
);
