class SlotRaceRegistrationsRaces extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
    };
    window.addEventListener("languageChanged", this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
    this.removeEvents();
  }

  render() {
    this.innerHTML = `
    <div>  
      <!-- Toolbar Component (Search + Add) -->
      <slotrace-registrations-races-toolbar class="d-block mb-3"></slotrace-registrations-races-toolbar>

      <!-- Races List Grid -->
      <slotrace-registrations-races-list class="mt-4 d-block"></slotrace-registrations-races-list>

      <!-- Delete Race Confirmation Modal -->
      <slotrace-registrations-races-delete-modal></slotrace-registrations-races-delete-modal>

      <!-- Edit Race Modal -->
      <slotrace-registrations-races-edit-modal></slotrace-registrations-races-edit-modal>

      <!-- Add Pilot Mini Modal -->
      <slotrace-registrations-races-add-pilot-modal></slotrace-registrations-races-add-pilot-modal>

      <!-- Select Track Mini Modal -->
      <slotrace-registrations-races-add-track-modal></slotrace-registrations-races-add-track-modal>
    </div>`;
  }

  setupEvents() {
    this._createEmptyRaceListener = () => {
      window.electronAPI.db
        .get("races")
        .then((races) => {
          const racesList = races || [];
          const nextNumber = racesList.length + 1;
          const defaultName = `${window.t("registrations.new_race") || "Nova Corrida"} #${nextNumber}`;
          const defaultTrack =
            window.t("registrations.default_track") || "Pista Padrão";

          const newRace = {
            id: Date.now().toString(),
            name: defaultName,
            date: new Date().toISOString(),
            trackId: "",
            trackName: defaultTrack,
            winner: "",
            pilots: [],
            type: "grand_prix",
          };

          // Prepend so it is listed first
          const updatedList = [newRace, ...racesList];
          return window.electronAPI.db.set("races", updatedList);
        })
        .then((success) => {
          if (success) {
            window.dispatchEvent(new CustomEvent("raceListChanged"));
          }
        })
        .catch((err) => {
          console.error("Failed to create empty race in database:", err);
        });
    };

    window.addEventListener(
      "requestCreateEmptyRace",
      this._createEmptyRaceListener,
    );
  }

  removeEvents() {
    if (this._createEmptyRaceListener) {
      window.removeEventListener(
        "requestCreateEmptyRace",
        this._createEmptyRaceListener,
      );
    }
  }
}

customElements.define("slotrace-races", SlotRaceRegistrationsRaces);
