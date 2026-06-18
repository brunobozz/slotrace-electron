class QualiToolbar extends HTMLElement {
  connectedCallback() {
    this._race = null;
    this._track = null;
    this._state = "idle"; // idle | qualifying | paused | interval
    this._isShuffling = false;

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

  setData({ race, track }) {
    this._race = race;
    this._track = track || {};
    this.render();
  }

  setState(state, isShuffling = false) {
    this._state = state;
    this._isShuffling = isShuffling;
    this._updateButtons();
  }

  render() {
    this.innerHTML = `
      <div class="quali-toolbar d-flex align-items-center justify-content-end p-2 border-bottom border-secondary-subtle px-4" style="height: 50px;">

        <!-- Right: Action buttons -->
        <div class="d-flex align-items-center gap-2">

          <!-- Mark Lap button -->
          <button id="btn-quali-lap" class="btn btn-sm fw-semibold d-flex align-items-center gap-1 px-3 d-none" style="background-color: #ff8c00; color: #fff; font-size: 0.85rem;">
            <i class="mdi mdi-flag-checkered"></i>
            ${window.t("realtime_quali.toolbar.mark_lap") || "Mark Lap"}
          </button>

        </div>

      </div>
    `;

    this._bindEvents();
    this._updateButtons();
  }

  _bindEvents() {
    const btnLap = this.querySelector("#btn-quali-lap");
    if (btnLap) {
      btnLap.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("qualiMarkLap"));
      });
    }
  }

  _updateButtons() {
    const btnLap = this.querySelector("#btn-quali-lap");

    switch (this._state) {
      case "idle":
      case "paused":
      case "interval":
      case "finished":
        btnLap?.classList.add("d-none");
        break;

      case "qualifying":
        btnLap?.classList.remove("d-none");
        break;
    }
  }
}

customElements.define("quali-toolbar", QualiToolbar);
