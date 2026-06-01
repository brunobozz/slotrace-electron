class SlotRaceRegistrationsRaces extends HTMLElement {
  connectedCallback() {
    this.render();

    this._createEmptyListener = () => {
      this.createEmptyRace();
    };
    window.addEventListener('requestCreateEmptyRace', this._createEmptyListener);

    this._editNameListener = (e) => {
      const { id, name } = e.detail;
      const promptMsg = window.t('registrations.rename_race_prompt') || 'Digite o novo nome para esta corrida:';
      const newName = prompt(promptMsg, name);
      if (newName !== null && newName.trim() !== '') {
        this.updateRaceName(id, newName.trim());
      }
    };
    window.addEventListener('requestEditRaceName', this._editNameListener);

    this._loadRaceListener = (e) => {
      const { race } = e.detail;
      const raceEl = document.querySelector('slotrace-race');
      if (raceEl) {
        raceEl.loadSavedRace(race);
        window.location.hash = '#race';
      }
    };
    window.addEventListener('requestLoadRace', this._loadRaceListener);
  }

  disconnectedCallback() {
    if (this._createEmptyListener) {
      window.removeEventListener('requestCreateEmptyRace', this._createEmptyListener);
    }
    if (this._editNameListener) {
      window.removeEventListener('requestEditRaceName', this._editNameListener);
    }
    if (this._loadRaceListener) {
      window.removeEventListener('requestLoadRace', this._loadRaceListener);
    }
  }

  createEmptyRace() {
    window.electronAPI.db.get('races').then(races => {
      const racesList = races || [];
      const newRaceNum = racesList.length + 1;
      
      const newRace = {
        id: Date.now().toString(),
        name: `${window.t("registrations.new_race") || "Nova Corrida"} #${newRaceNum}`,
        trackName: window.t("registrations.default_track") || "Pista Padrão",
        trackId: "",
        date: new Date().toLocaleDateString(),
        standings: []
      };

      racesList.push(newRace);
      return window.electronAPI.db.set('races', racesList);
    }).then(success => {
      if (success) {
        window.dispatchEvent(new CustomEvent('raceListChanged'));
      }
    }).catch(err => {
      console.error('Failed to create empty race history item:', err);
    });
  }

  updateRaceName(raceId, newName) {
    window.electronAPI.db.get('races').then(races => {
      const racesList = races || [];
      const race = racesList.find(r => r.id === raceId);
      if (race) {
        race.name = newName;
      }
      return window.electronAPI.db.set('races', racesList);
    }).then(success => {
      if (success) {
        window.dispatchEvent(new CustomEvent('raceListChanged'));
      }
    }).catch(err => {
      console.error('Failed to update race name:', err);
    });
  }

  render() {
    this.innerHTML = `
      <!-- Toolbar Component (Search + Add) -->
      <slotrace-registrations-races-toolbar class="d-block mb-3"></slotrace-registrations-races-toolbar>

      <!-- Grid List Grid Component -->
      <slotrace-registrations-races-list class="mt-4 d-block"></slotrace-registrations-races-list>

      <!-- Delete Race Confirmation Modal Component -->
      <slotrace-registrations-races-delete-modal></slotrace-registrations-races-delete-modal>
    `;
  }
}

customElements.define('slotrace-registrations-races', SlotRaceRegistrationsRaces);
