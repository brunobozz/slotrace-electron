class SlotRaceRegistrationsRacesList extends HTMLElement {
  connectedCallback() {
    this.races = [];
    this.filterQuery = "";

    // Load races on connect
    this.loadRaces();

    this._langListener = () => this.render();
    this._listChangedListener = () => this.loadRaces();
    this._filterListener = (e) => {
      this.filterQuery = e.detail.query;
      this.render();
    };

    window.addEventListener("languageChanged", this._langListener);
    window.addEventListener("raceListChanged", this._listChangedListener);
    window.addEventListener("raceFilterChanged", this._filterListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
    if (this._listChangedListener) {
      window.removeEventListener("raceListChanged", this._listChangedListener);
    }
    if (this._filterListener) {
      window.removeEventListener("raceFilterChanged", this._filterListener);
    }
  }

  loadRaces() {
    Promise.all([
      window.electronAPI.db.get("races"),
      window.electronAPI.db.get("tracks")
    ])
      .then(([races, tracks]) => {
        this.tracks = tracks || [];
        // Sort descending: newly created races first
        this.races = (races || []).sort((a, b) => (b.id || "").localeCompare(a.id || ""));
        this.render();
      })
      .catch((err) => {
        console.error("Failed to load races and tracks for list:", err);
      });
  }

  render() {
    if (this.races.length === 0) {
      this.innerHTML = `
        <div class="py-5 text-center fade-in">
          <i class="mdi mdi-flag-outline text-secondary fs-1 mb-3 d-block text-center"></i>
          <h6 class="fw-bold text-body-emphasis mb-1 text-center">${window.t("registrations.no_races_listed") || "Nenhuma corrida salva no histórico ainda."}</h6>
          <p class="text-secondary small mb-0 text-center">${window.t("registrations.no_races_help") || "Finalize uma corrida e clique em salvar os resultados no histórico para vê-la aqui."}</p>
        </div>
      `;
      return;
    }

    let filtered = this.races;
    if (this.filterQuery && this.filterQuery.trim()) {
      const q = this.filterQuery.toLowerCase().trim();
      filtered = this.races.filter((race) => {
        const name = (race.name || "").toLowerCase();
        const track = (race.trackName || "").toLowerCase();
        const winner = (race.winner || "").toLowerCase();
        return name.includes(q) || track.includes(q) || winner.includes(q);
      });
    }

    if (filtered.length === 0) {
      this.innerHTML = `
        <div class="py-5 text-center fade-in">
          <i class="mdi mdi-magnify-close text-secondary fs-1 mb-3 d-block text-center"></i>
          <h5 class="fw-bold text-body-emphasis mb-1 text-center">${window.t("registrations.no_races_found")}</h5>
          <p class="text-secondary small mb-0 text-center">${window.t("registrations.no_races_found_desc")}</p>
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <div class="row" id="races-grid-container"></div>
    `;

    const container = this.querySelector("#races-grid-container");
    filtered.forEach((race) => {
      const col = document.createElement("div");
      col.className = "col-12 col-md-12 col-lg-6 col-xxl-4 mb-4 fade-in";

      const card = document.createElement("slotrace-registrations-races-card");
      card.className = "d-block h-100";
      
      // Associate track photo
      const trackObj = (this.tracks || []).find(t => t.id === race.trackId);
      card.trackPhoto = trackObj ? trackObj.photo : "";
      card.race = race;

      col.appendChild(card);
      container.appendChild(col);
    });
  }
}

// Define the custom element <slotrace-registrations-races-list>
customElements.define("slotrace-registrations-races-list", SlotRaceRegistrationsRacesList);
