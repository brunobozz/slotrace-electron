class SlotRaceRegistrationsRacesForm extends HTMLElement {
  constructor() {
    super();
    this.race = null;
    this.tracks = [];
    this.selectedTrackId = "";
  }

  connectedCallback() {
    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
      if (this.race) {
        this.populateForm();
      }
    };

    this._trackSelectedListener = (e) => {
      const { trackId } = e.detail;
      this.selectedTrackId = trackId || "";
      this.renderTrackPreview();
      this.dispatchEvent(
        new CustomEvent("raceFormInput", {
          bubbles: true,
          composed: true,
        }),
      );
    };

    window.addEventListener("languageChanged", this._langListener);
    window.addEventListener("raceTrackSelected", this._trackSelectedListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
    if (this._trackSelectedListener) {
      window.removeEventListener(
        "raceTrackSelected",
        this._trackSelectedListener,
      );
    }
  }

  setParams(race, tracks) {
    this.race = race;
    this.tracks = tracks || [];
    this.selectedTrackId = race ? race.trackId || "" : "";
    this.render();
    this.setupEvents();
    this.populateForm();
  }

  populateForm() {
    if (!this.race) return;

    // Populate type field
    const typeSelect = this.querySelector("#select-race-edit-type");
    if (typeSelect) {
      typeSelect.value = this.race.type || "grand_prix";
    }

    // Populate name field
    const nameInput = this.querySelector("#input-race-edit-name");
    if (nameInput) {
      nameInput.value = this.race.name || "";
    }

    // Render track selection preview
    this.renderTrackPreview();

    // Populate date field
    const dateInput = this.querySelector("#input-race-edit-date");
    if (dateInput) {
      const d = this.race.date ? new Date(this.race.date) : new Date();
      const pad = (num) => String(num).padStart(2, "0");
      const dateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      dateInput.value = dateVal;
    }
  }

  renderTrackPreview() {
    const previewContainer = this.querySelector("#track-selector-preview");
    if (!previewContainer) return;

    const trackObj = this.tracks.find(
      (t) => String(t.id) === String(this.selectedTrackId),
    );

    if (trackObj) {
      const photoUrl = trackObj.photo || "";
      previewContainer.innerHTML = `
        ${
          photoUrl
            ? `<img src="${photoUrl}" class="w-100 h-100 object-fit-cover" style="transition: transform 0.2s ease;">`
            : `<div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary">
                 <i class="mdi mdi-go-kart-track text-secondary" style="font-size: 48px;"></i>
               </div>`
        }
        <slotrace-lane-dots class="position-absolute my-2" style="bottom:0px; left: 10px; z-index: 2;"></slotrace-lane-dots>
        <div class="position-absolute start-0 w-100 text-white p-3 text-truncate small fw-semibold" style="bottom:20px; text-shadow: 1px 1px 3px #000000;">
          ${trackObj.name}
        </div>
      `;

      const laneDots = previewContainer.querySelector("slotrace-lane-dots");
      if (laneDots) {
        laneDots.setTrack(trackObj);
      }
    } else {
      previewContainer.innerHTML = `
        <div class="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-secondary gap-1 p-3">
          <i class="mdi mdi-plus-circle-outline" style="font-size: 32px; line-height: 1;"></i>
          <span class="small fw-semibold text-center" style="font-size: 0.8rem;">
            ${window.t("registrations.select_a_track") || "Selecione a Pista"}
          </span>
        </div>
      `;
    }
  }

  getValues() {
    const typeSelect = this.querySelector("#select-race-edit-type");
    const type = typeSelect ? typeSelect.value : "grand_prix";

    const nameInput = this.querySelector("#input-race-edit-name");
    const name = nameInput ? nameInput.value.trim() : "";

    const trackId = this.selectedTrackId || "";

    const dateInput = this.querySelector("#input-race-edit-date");
    let date = (this.race && this.race.date) || new Date().toISOString();
    if (dateInput && dateInput.value) {
      try {
        const origDate =
          this.race && this.race.date ? new Date(this.race.date) : new Date();
        const [year, month, day] = dateInput.value.split("-").map(Number);
        origDate.setFullYear(year);
        origDate.setMonth(month - 1);
        origDate.setDate(day);
        date = origDate.toISOString();
      } catch (e) {
        // Fallback
      }
    }

    return { type, name, trackId, date };
  }

  setupEvents() {
    const inputs = this.querySelectorAll("input, select");
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        this.dispatchEvent(
          new CustomEvent("raceFormInput", {
            bubbles: true,
            composed: true,
          }),
        );
      });
      input.addEventListener("change", () => {
        this.dispatchEvent(
          new CustomEvent("raceFormInput", {
            bubbles: true,
            composed: true,
          }),
        );
      });
    });

    const preview = this.querySelector("#track-selector-preview");
    if (preview) {
      preview.addEventListener("click", () => {
        window.dispatchEvent(
          new CustomEvent("requestOpenSelectTrack", {
            detail: {
              tracks: this.tracks,
              selectedTrackId: this.selectedTrackId,
            },
          }),
        );
      });
    }
  }

  render() {
    this.innerHTML = `
      <style>
        #track-selector-preview:hover {
          border-color: var(--bs-primary) !important;
        }
        #track-selector-preview:hover img {
          transform: scale(1.03);
        }
      </style>

      <div class="d-flex flex-column gap-3">
        <!-- Tipo -->
        <div>
          <label for="select-race-edit-type" class="form-label fw-semibold text-secondary small">
            Tipo de Corrida
          </label>
          <select id="select-race-edit-type" class="form-select">
            <option value="grand_prix">Grande Prêmio</option>
          </select>
        </div>

        <!-- Nome -->
        <div>
          <label for="input-race-edit-name" class="form-label fw-semibold text-secondary small">
            ${window.t("registrations.modal.name_label") || "Nome"}
          </label>
          <input type="text" id="input-race-edit-name" class="form-control" required placeholder="${window.t("registrations.new_race") || "Nome da Corrida"}">
        </div>

        <!-- Data -->
        <div>
          <label for="input-race-edit-date" class="form-label fw-semibold text-secondary small">
            ${window.t("registrations.races_modal.date_label") || "Data"}
          </label>
          <input type="date" id="input-race-edit-date" class="form-control" required>
        </div>

        <!-- Pista -->
        <div>
          <label class="form-label fw-semibold text-secondary small mb-1.5">
            ${window.t("registrations.races_modal.track_label") || "Pista Utilizada"}
          </label>
          <div id="track-selector-preview" class="border border-secondary-subtle rounded-3 bg-body-secondary overflow-hidden position-relative shadow-sm" style="aspect-ratio: 16/9; cursor: pointer; transition: border-color 0.2s ease;">
            <!-- Rendered dynamically -->
          </div>
        </div>
    </div>
    `;
  }
}

customElements.define(
  "slotrace-registrations-races-form",
  SlotRaceRegistrationsRacesForm,
);
