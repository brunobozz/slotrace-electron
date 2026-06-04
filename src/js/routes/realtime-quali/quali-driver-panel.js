function getLaneColor(lane) {
  const colors = {
    1: "#ff3b30", // Red
    2: "#007aff", // Blue
    3: "#34c759", // Green
    4: "#ffcc00", // Yellow
    5: "#ff9500", // Orange
    6: "#ffffff", // White
    7: "#af52de", // Purple
    8: "#8e8e93", // Grey
  };
  return colors[lane] || "#8e8e93";
}

class QualiDriverPanel extends HTMLElement {
  connectedCallback() {
    this._driver = null;
    this._qualiRecord = null;
    this._lane = 1;
    this.render();

    this._langListener = () => {
      this.render();
    };
    window.addEventListener("languageChanged", this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
  }

  setData({ driver, qualiRecord, overallBestTime, lane, laneColors }) {
    this._driver = driver || null;
    this._qualiRecord = qualiRecord || null;
    this._overallBestTime = overallBestTime || 0;
    this._lane = lane || 1;
    this._laneColors = laneColors || null;
    this.render();
  }

  _formatTime(seconds) {
    if (seconds == null || isNaN(seconds)) return "--.--.----";
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(4);
    const paddedSecs = secs.padStart(7, "0");
    return mins > 0
      ? `${String(mins).padStart(2, "0")}:${paddedSecs}`
      : paddedSecs;
  }

  render() {
    const driver = this._driver;
    const record = this._qualiRecord;

    let pilotName = "--";
    if (driver) {
      const baseName = driver.name ? driver.name : driver.nickname || "";
      if (baseName) {
        pilotName = baseName.trim().split(/\s+/)[0];
      }
    }
    const laps = record ? (record.laps ?? "--") : "--";
    const bestTimeVal =
      record && record.bestLapTime ? parseFloat(record.bestLapTime) : 0;
    const bestTime =
      bestTimeVal > 0 ? this._formatTime(bestTimeVal) : "--.--.----";

    // Current lap time: last element in lapTimes array
    let currentTime = "--.--.----";
    if (record && record.lapTimes && record.lapTimes.length > 0) {
      currentTime = this._formatTime(
        record.lapTimes[record.lapTimes.length - 1],
      );
    }

    const labelDriver =
      window.t("realtime_quali.pilot_panel.driver") || "DRIVER";
    const labelLast = window.t("realtime_quali.pilot_panel.last") || "TIME";
    const labelLaps = window.t("realtime_quali.pilot_panel.laps") || "LAPS";
    const labelBest = window.t("realtime_quali.pilot_panel.best") || "BEST";

    // Best time color logic
    let bestTimeColor = "";
    if (bestTimeVal > 0) {
      const isRaceBest =
        this._overallBestTime > 0 &&
        Math.abs(bestTimeVal - this._overallBestTime) < 0.0001;
      bestTimeColor = isRaceBest ? "color: #aa55ff;" : "color: #00bb44;";
    }

    const defaultColors = {
      1: "#ff3b30", // Red
      2: "#007aff", // Blue
      3: "#34c759", // Green
      4: "#ffcc00", // Yellow
      5: "#ff9500", // Orange
      6: "#ffffff", // White
      7: "#af52de", // Purple
      8: "#8e8e93", // Grey
    };
    const laneColor =
      (this._laneColors && this._laneColors[this._lane - 1]) ||
      defaultColors[this._lane] ||
      "#8e8e93";

    this.innerHTML = `
      <div class="quali-driver-panel d-flex flex-column justify-content-between h-100 border-end border-secondary-subtle">

        <!-- Pilot & Lane Info -->
        <div class="d-flex flex-column flex-grow-1 justify-content-center border-bottom border-secondary-subtle p-3">
          <div class="text-uppercase text-body-secondary fw-bold fs-4" style="letter-spacing: 0.1rem;">
            ${labelDriver}
          </div>
          <div class="d-flex align-items-center justify-content-around flex-grow-1">
            <div class="display-1 fw-bold font-monospace text-body-secondary">
              ${pilotName}
            </div>
            <div class="d-flex align-items-center justify-content-center">
              <span style="display: inline-block; width: 100px; height: 100px; border-radius: 50%; background-color: ${laneColor};"></span>
            </div>
          </div>
        </div>

        <!-- Time -->
        <div class="d-flex flex-column flex-grow-1 justify-content-center border-bottom border-secondary-subtle p-3">
          <div class="text-uppercase text-body-secondary fw-bold fs-4" style="letter-spacing: 0.1rem;">
            ${labelLast}
          </div>
          <div class="d-flex align-items-center justify-content-center flex-grow-1">
            <div class="display-1 fw-bold font-monospace text-body-secondary" style="font-size: 6.5rem;">
              ${currentTime}
            </div>
          </div>
        </div>

        <!-- Best -->
        <div class="d-flex flex-column flex-grow-1 justify-content-center border-bottom border-secondary-subtle p-3">
          <div class="text-uppercase text-body-secondary fw-bold fs-4" style="letter-spacing: 0.1rem;">
            ${labelBest}
          </div>
          <div class="d-flex align-items-center justify-content-center flex-grow-1">
            <div class="display-1 fw-bold font-monospace" style="${bestTimeColor} font-size: 6.5rem;">
              ${bestTime}
            </div>
          </div>
        </div>

        <!-- Laps -->
        <div class="d-flex flex-column flex-grow-1 justify-content-center p-3">
          <div class="text-uppercase text-body-secondary fw-bold fs-4" style="letter-spacing: 0.1rem;">
            ${labelLaps}
          </div>
          <div class="d-flex align-items-center justify-content-center flex-grow-1">
            <div class="display-1 fw-bold font-monospace text-body-secondary" style="font-size: 6.5rem;">
              ${laps}
            </div>
          </div>
        </div>

      </div>
    `;
  }
}

customElements.define("quali-driver-panel", QualiDriverPanel);
