class QualiLaps extends HTMLElement {
  connectedCallback() {
    this.lapTimes = [];
    this._overallBestTime = 0;
    this._activeLapNum = 0;
    this._firstLapMarked = false;
    this.innerHTML = "";

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

  setData({ lapTimes, overallBestTime, activeLapNum, firstLapMarked }) {
    this.lapTimes = lapTimes || [];
    this._overallBestTime = overallBestTime || 0;
    this._activeLapNum = activeLapNum || 0;
    this._firstLapMarked = !!firstLapMarked;
    this.render();
  }

  updateRunningTime(elapsedSeconds) {
    const activeEl = this.querySelector("#active-lap-time");
    if (activeEl) {
      activeEl.textContent = elapsedSeconds.toFixed(4);
    }
  }

  _findBestLapIndex() {
    if (this.lapTimes.length === 0) return -1;

    let bestIndex = -1;
    let bestTime = 0;

    this.lapTimes.forEach((time, idx) => {
      const val = parseFloat(time) || 0;
      if (val > 0) {
        if (bestTime === 0 || val < bestTime - 0.0001) {
          bestTime = val;
          bestIndex = idx;
        }
      }
    });

    return bestIndex;
  }

  _getBestTime() {
    const bestIdx = this._findBestLapIndex();
    if (bestIdx < 0) return 0;
    return parseFloat(this.lapTimes[bestIdx]) || 0;
  }

  render() {
    const bestIdx = this._findBestLapIndex();
    const personalBest = this._getBestTime();
    const isRaceBest =
      personalBest > 0 &&
      this._overallBestTime > 0 &&
      Math.abs(personalBest - this._overallBestTime) < 0.0001;

    let rowsHtml = "";

    if (this.lapTimes.length === 0 && !this._firstLapMarked) {
      rowsHtml = `
        <div class="d-flex align-items-center justify-content-center h-100">
        </div>
      `;
    } else {
      const finishedLapsHtml = this.lapTimes
        .map((time, index) => {
          const lapNum = index + 1;
          const val = parseFloat(time) || 0;
          const timeStr = val > 0 ? val.toFixed(4) : "—";
          const isBest = index === bestIdx;

          let fastestColor = "";

          if (isBest) {
            if (isRaceBest) {
              // Race best = purple
              fastestColor = "color: #aa55ff !important";
            } else {
              // Personal best = green
              fastestColor = "color: #00bb44 !important";
            }
          }

          return `
          <div class="d-flex align-items-center justify-content-between px-4 py-2 border-bottom border-secondary-subtle">
            <div class="text-body-secondary" style="font-weight: 700; ${fastestColor}; font-size: 2.8rem; font-family: 'Courier New', monospace;">
              ${lapNum}
            </div>
            <div class="fw-bold font-monospace text-end display-2 text-body-secondary" style="${fastestColor};">
              ${timeStr}
            </div>
          </div>
        `;
        })
        .reverse()
        .join("");

      let activeRowHtml = "";
      if (this._firstLapMarked && this._activeLapNum > 0) {
        activeRowHtml = `
          <div class="d-flex align-items-center justify-content-between px-4 py-2 border-bottom border-secondary-subtle">
            <div class="text-primary" style="font-weight: 700; font-size: 2.8rem; font-family: 'Courier New', monospace;">
              ${this._activeLapNum}
            </div>
            <div id="active-lap-time" class="text-primary" style="font-family: 'Courier New', monospace; font-size: 4.0rem; font-weight: 700; text-align: right;">
              0.0000
            </div>
          </div>
        `;
      }

      rowsHtml = activeRowHtml + finishedLapsHtml;
    }

    this.innerHTML = `
      <div class="d-flex flex-column h-100 border-end border-secondary-subtle">
        <!-- Header -->
        <div class="border-bottom border-secondary-subtle p-2">
          <div class="text-uppercase text-body-secondary text-center fw-bold" style="letter-spacing: 0.1rem;">
            ${window.t("realtime_quali.laps.title") || "LAP TIMES"}
          </div>
        </div>
        <!-- Laps list -->
        <div class="flex-grow-1" style="overflow-y: auto;">
          ${rowsHtml}
        </div>
      </div>
    `;
  }
}

customElements.define("quali-laps", QualiLaps);
