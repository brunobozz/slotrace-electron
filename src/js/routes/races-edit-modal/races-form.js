class SlotRaceRegistrationsRacesForm extends HTMLElement {
  constructor() {
    super();
    this.race = null;
    this.tracks = [];
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

    window.addEventListener("languageChanged", this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
  }

  setParams(race, tracks) {
    this.race = race;
    this.tracks = tracks || [];
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

    // Populate track options
    const trackSelect = this.querySelector("#select-race-edit-track");
    if (trackSelect) {
      trackSelect.innerHTML = "";

      // Default option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent =
        window.t("registrations.default_track") || "Pista Padrão";
      trackSelect.appendChild(defaultOption);

      this.tracks.forEach((track) => {
        const option = document.createElement("option");
        option.value = track.id;
        option.textContent = track.name;
        trackSelect.appendChild(option);
      });

      // Select active track
      if (this.race.trackId) {
        trackSelect.value = this.race.trackId;
      } else {
        trackSelect.value = "";
      }
    }

    // Populate date field
    const dateInput = this.querySelector("#input-race-edit-date");
    if (dateInput) {
      const d = this.race.date ? new Date(this.race.date) : new Date();
      const pad = (num) => String(num).padStart(2, "0");
      const dateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      dateInput.value = dateVal;
    }
  }

  getValues() {
    const typeSelect = this.querySelector("#select-race-edit-type");
    const type = typeSelect ? typeSelect.value : "grand_prix";

    const nameInput = this.querySelector("#input-race-edit-name");
    const name = nameInput ? nameInput.value.trim() : "";

    const trackSelect = this.querySelector("#select-race-edit-track");
    const trackId = trackSelect ? trackSelect.value : "";

    const dateInput = this.querySelector("#input-race-edit-date");
    let date = (this.race && this.race.date) || new Date().toISOString();
    if (dateInput && dateInput.value) {
      try {
        const origDate = this.race && this.race.date ? new Date(this.race.date) : new Date();
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
  }

  render() {
    this.innerHTML = `
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

      <!-- Pista -->
      <div>
        <label for="select-race-edit-track" class="form-label fw-semibold text-secondary small">
          ${window.t("registrations.races_modal.track_label") || "Pista Utilizada"}
        </label>
        <select id="select-race-edit-track" class="form-select">
          <!-- Options loaded dynamically -->
        </select>
      </div>

      <!-- Data -->
      <div>
        <label for="input-race-edit-date" class="form-label fw-semibold text-secondary small">
          ${window.t("registrations.races_modal.date_label") || "Data"}
        </label>
        <input type="date" id="input-race-edit-date" class="form-control" required>
      </div>
    `;
  }
}

customElements.define(
  "slotrace-registrations-races-form",
  SlotRaceRegistrationsRacesForm,
);
