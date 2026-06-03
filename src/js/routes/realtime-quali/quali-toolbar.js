class QualiToolbar extends HTMLElement {
  connectedCallback() {
    this._race = null;
    this._track = null;
    this._state = "idle"; // idle | qualifying | paused | interval

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

  setState(state) {
    this._state = state;
    this._updateButtons();
  }

  _hasPilots() {
    return this._race && this._race.pilots && this._race.pilots.length > 0;
  }

  render() {
    const laneCount = parseInt(this._track?.lanes) || 0;
    const laneColors = this._track?.laneColors || [];

    const defaultColors = [
      "#ff3b30",
      "#007aff",
      "#34c759",
      "#ffcc00",
      "#ff9500",
      "#ffffff",
      "#af52de",
      "#8e8e93",
    ];

    const colorHexToId = {
      "#ff3b30": 1,
      "#007aff": 2,
      "#34c759": 3,
      "#ffcc00": 4,
      "#ff9500": 5,
      "#ffffff": 6,
      "#af52de": 7,
      "#8e8e93": 8,
    };

    const timeVal =
      this._race?.timePerPilot !== undefined ? this._race.timePerPilot : 60;
    const intervalVal =
      this._race?.interval !== undefined ? this._race.interval : 10;
    const selectedLane = this._race?.lane !== undefined ? this._race.lane : 1;

    let laneOptions = "";
    for (let i = 1; i <= laneCount; i++) {
      const colorHex =
        laneColors[i - 1] || defaultColors[(i - 1) % defaultColors.length];
      const isSelected = i === parseInt(selectedLane) ? "selected" : "";
      laneOptions += `<option value="${i}" style="color: ${colorHex}; font-weight: bold;" ${isSelected}>${window.t("realtime_quali.toolbar.lane") || "Fenda"} ${i}</option>`;
    }

    const hasPilots = this._hasPilots();
    const isIdle = this._state === "idle";
    const startDisabled = !hasPilots && isIdle ? "disabled" : "";

    this.innerHTML = `
      <div class="quali-toolbar d-flex align-items-center justify-content-between p-2 border-bottom border-secondary-subtle" style="height: 50px;">

        <!-- Left: Fields -->
        <div class="d-flex align-items-center gap-3">

          <!-- Time per pilot -->
          <div class="input-group input-group-sm" style="width: 110px;" title="${window.t("realtime_quali.toolbar.time_per_pilot") || "Time (per pilot)"}">
            <span class="input-group-text text-secondary border-secondary-subtle"><i class="mdi mdi-clock-outline"></i></span>
            <input type="number" id="quali-time" class="form-control border-secondary-subtle text-end px-2" min="1" step="1" value="${timeVal}" style="font-size: 0.8rem; box-shadow: none;">
            <span class="input-group-text text-secondary border-secondary-subtle">s</span>
          </div>

          <!-- Interval -->
          <div class="input-group input-group-sm" style="width: 110px;" title="${window.t("realtime_quali.toolbar.interval") || "Interval"}">
            <span class="input-group-text text-secondary border-secondary-subtle"><i class="mdi mdi-timer-sand"></i></span>
            <input type="number" id="quali-interval" class="form-control border-secondary-subtle text-end px-2" min="0" step="1" value="${intervalVal}" style="font-size: 0.8rem; box-shadow: none;">
            <span class="input-group-text text-secondary border-secondary-subtle">s</span>
          </div>

          <!-- Lane -->
          <div class="input-group input-group-sm" style="width: 130px;" title="${window.t("realtime_quali.toolbar.lane") || "Lane"}">
            <span class="input-group-text text-secondary border-secondary-subtle"><i class="mdi mdi-road-variant"></i></span>
            <select id="quali-lane" class="form-select border-secondary-subtle px-2" style="font-size: 0.8rem; box-shadow: none; font-weight: bold;">
              ${laneOptions}
            </select>
          </div>

        </div>

        <!-- Right: Action buttons -->
        <div class="d-flex align-items-center gap-2">

          <!-- Mark Lap button -->
          <button id="btn-quali-lap" class="btn btn-sm fw-semibold d-flex align-items-center gap-1 px-3 d-none" style="background-color: #ff8c00; color: #fff; font-size: 0.85rem;">
            <i class="mdi mdi-flag-checkered"></i>
            ${window.t("realtime_quali.toolbar.mark_lap") || "Mark Lap"}
          </button>

          <!-- Pause button -->
          <button id="btn-quali-pause" class="btn btn-sm fw-semibold d-flex align-items-center gap-1 px-3 d-none" style="background-color: #ffc107; color: #212529; font-size: 0.85rem;">
            <i class="mdi mdi-pause"></i>
            ${window.t("realtime_quali.toolbar.pause") || "Pause"}
          </button>

          <!-- Start / Resume button -->
          <button id="btn-quali-start" class="btn btn-sm fw-semibold d-flex align-items-center gap-1 px-3" style="background-color: #28a745; color: #fff; font-size: 0.85rem;" ${startDisabled}>
            <i class="mdi mdi-play"></i>
            ${window.t("realtime_quali.toolbar.start") || "Start"}
          </button>

          <!-- Finish button -->
          <button id="btn-quali-finish" class="btn btn-sm fw-semibold d-flex align-items-center gap-1 px-3 d-none" style="background-color: #0d6efd; color: #fff; font-size: 0.85rem;">
            <i class="mdi mdi-check-all"></i>
            ${window.t("realtime_quali.toolbar.finish") || "Finish"}
          </button>

        </div>

      </div>
    `;

    this._bindEvents();
    this._updateLaneSelectColor();
    this._updateButtons();
  }

  _bindEvents() {
    const btnStart = this.querySelector("#btn-quali-start");
    const btnPause = this.querySelector("#btn-quali-pause");
    const btnLap = this.querySelector("#btn-quali-lap");

    if (btnStart) {
      btnStart.addEventListener("click", () => {
        if (this._state === "idle") {
          const timePerPilot =
            parseInt(this.querySelector("#quali-time")?.value) || 60;
          const lane = parseInt(this.querySelector("#quali-lane")?.value) || 1;
          const interval =
            parseInt(this.querySelector("#quali-interval")?.value) || 10;
          window.dispatchEvent(
            new CustomEvent("qualiSessionStart", {
              detail: { timePerPilot, lane, interval },
            }),
          );
        } else if (this._state === "paused") {
          window.dispatchEvent(new CustomEvent("qualiSessionResume"));
        }
      });
    }

    if (btnPause) {
      btnPause.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("qualiSessionPause"));
      });
    }

    if (btnLap) {
      btnLap.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("qualiMarkLap"));
      });
    }

    const btnFinish = this.querySelector("#btn-quali-finish");
    if (btnFinish) {
      btnFinish.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("qualiSessionFinish"));
      });
    }

    const timeInput = this.querySelector("#quali-time");
    const intervalInput = this.querySelector("#quali-interval");
    const laneSelect = this.querySelector("#quali-lane");

    const handleInputChange = () => {
      const timePerPilot = parseInt(timeInput?.value) || 60;
      const interval = parseInt(intervalInput?.value) || 10;
      const lane = parseInt(laneSelect?.value) || 1;

      window.dispatchEvent(
        new CustomEvent("qualiConfigChanged", {
          detail: { timePerPilot, interval, lane },
        }),
      );
    };

    if (timeInput) {
      timeInput.addEventListener("input", handleInputChange);
    }
    if (intervalInput) {
      intervalInput.addEventListener("input", handleInputChange);
    }

    if (laneSelect) {
      laneSelect.addEventListener("change", () => {
        this._updateLaneSelectColor();
        handleInputChange();
        window.dispatchEvent(
          new CustomEvent("qualiLaneChanged", {
            detail: { lane: parseInt(laneSelect.value) || 1 },
          }),
        );
      });
    }
  }

  _updateButtons() {
    const btnStart = this.querySelector("#btn-quali-start");
    const btnPause = this.querySelector("#btn-quali-pause");
    const btnLap = this.querySelector("#btn-quali-lap");
    const btnFinish = this.querySelector("#btn-quali-finish");
    const inputs = this.querySelectorAll(
      "#quali-time, #quali-lane, #quali-interval",
    );

    if (!btnStart) return;

    const hasPilots = this._hasPilots();

    switch (this._state) {
      case "idle":
        btnStart.classList.remove("d-none");
        btnStart.disabled = !hasPilots;
        btnStart.querySelector("i").className = "mdi mdi-play";
        btnStart.querySelector("i").nextSibling.textContent =
          " " + (window.t("realtime_quali.toolbar.start") || "Start");
        btnPause?.classList.add("d-none");
        btnLap?.classList.add("d-none");
        btnFinish?.classList.add("d-none");
        inputs.forEach((el) => (el.disabled = false));
        break;

      case "qualifying":
        btnStart.classList.add("d-none");
        btnPause?.classList.remove("d-none");
        btnLap?.classList.remove("d-none");
        btnFinish?.classList.add("d-none");
        inputs.forEach((el) => (el.disabled = true));
        break;

      case "paused":
        btnStart.classList.remove("d-none");
        btnStart.disabled = false;
        btnStart.querySelector("i").className = "mdi mdi-play";
        btnStart.querySelector("i").nextSibling.textContent =
          " " + (window.t("realtime_quali.toolbar.resume") || "Resume");
        btnPause?.classList.add("d-none");
        btnLap?.classList.add("d-none");
        btnFinish?.classList.add("d-none");
        inputs.forEach((el) => (el.disabled = true));
        break;

      case "interval":
        btnStart.classList.add("d-none");
        btnPause?.classList.remove("d-none");
        btnLap?.classList.add("d-none");
        btnFinish?.classList.add("d-none");
        inputs.forEach((el) => (el.disabled = true));
        break;

      case "finished":
        btnStart.classList.add("d-none");
        btnPause?.classList.add("d-none");
        btnLap?.classList.add("d-none");
        btnFinish?.classList.remove("d-none");
        inputs.forEach((el) => (el.disabled = true));
        break;
    }
  }

  _updateLaneSelectColor() {
    const select = this.querySelector("#quali-lane");
    if (!select) return;

    const laneColors = this._track?.laneColors || [];
    const defaultColors = [
      "#ff3b30",
      "#007aff",
      "#34c759",
      "#ffcc00",
      "#ff9500",
      "#ffffff",
      "#af52de",
      "#8e8e93",
    ];

    const val = parseInt(select.value) || 1;
    const activeColor =
      laneColors[val - 1] ||
      defaultColors[(val - 1) % defaultColors.length] ||
      "#ffffff";
    select.style.color = activeColor;
  }
}

customElements.define("quali-toolbar", QualiToolbar);
