class SlotRaceRealtimeRaceHeader extends HTMLElement {
  connectedCallback() {
    this._race = null;
    this._state = "idle"; // idle | running | paused | finished | interval

    this._langListener = () => {
      this.render();
    };
    window.addEventListener("languageChanged", this._langListener);

    this.render();
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
  }

  setData({ race }) {
    this._race = race;
    this.render();
  }

  setState(state) {
    this._state = state;
    const controls = this.querySelector("slotrace-realtime-race-controls");
    if (controls) {
      controls.setState(state);
    }
  }

  render() {
    const raceName = this._race?.name || "";
    const nameEl = this.querySelector("#header-race-name");
    if (nameEl) {
      nameEl.textContent = raceName;
      nameEl.setAttribute("title", raceName);

      const controls = this.querySelector("slotrace-realtime-race-controls");
      if (controls) {
        controls.setState(this._state);
      }
      return;
    }

    this.innerHTML = `
      <div class="modal-header border-bottom border-secondary-subtle px-4 py-0 d-flex align-items-center justify-content-between">
        
        <!-- Left: Race Name & Subtitle -->
        <div class="text-start">
          <h2 id="header-race-name" class="fw-bold mb-0 text-uppercase text-body-secondary tracking-wider fs-3 text-truncate" style="letter-spacing: 0.05em;" title="${raceName}">
            ${raceName}
          </h2>
          <div class="text-primary fw-semibold tracking-widest mt-0.5" style="font-size: 0.8rem; letter-spacing: 0.25em;">
            CORRIDA
          </div>
        </div>

        <div class="d-flex align-items-center gap-1 justify-content-center">
          <slotrace-realtime-race-controls></slotrace-realtime-race-controls>
          <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close" style="outline: none; box-shadow: none;"></button>
        </div>
          
        <div class="d-flex align-items-center gap-3 justify-content-end" style="width: 300px;">
          <slotrace-timer></slotrace-timer>
        </div>

      </div>
    `;

    const controls = this.querySelector("slotrace-realtime-race-controls");
    if (controls) {
      controls.setState(this._state);
    }
  }
}

customElements.define(
  "slotrace-realtime-race-header",
  SlotRaceRealtimeRaceHeader,
);
