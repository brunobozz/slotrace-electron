class QualiLaps extends HTMLElement {
  connectedCallback() {
    this.lapTimes = [];
    this._overallBestTime = 0;
    this._activeLapNum = 0;
    this._firstLapMarked = false;
    this.innerHTML = '';
  }

  setData({ lapTimes, overallBestTime, activeLapNum, firstLapMarked }) {
    this.lapTimes = lapTimes || [];
    this._overallBestTime = overallBestTime || 0;
    this._activeLapNum = activeLapNum || 0;
    this._firstLapMarked = !!firstLapMarked;
    this.render();
  }

  updateRunningTime(elapsedSeconds) {
    const activeEl = this.querySelector('#active-lap-time');
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
    const isRaceBest = personalBest > 0 && this._overallBestTime > 0 && Math.abs(personalBest - this._overallBestTime) < 0.0001;

    let rowsHtml = '';

    if (this.lapTimes.length === 0 && !this._firstLapMarked) {
      rowsHtml = `
        <div class="d-flex align-items-center justify-content-center h-100" style="color: #8b949e; font-size: 0.9rem;">
          —
        </div>
      `;
    } else {
      const finishedLapsHtml = this.lapTimes.map((time, index) => {
        const lapNum = index + 1;
        const val = parseFloat(time) || 0;
        const timeStr = val > 0 ? val.toFixed(4) : '—';
        const isBest = index === bestIdx;

        let numColor = '#8b949e';
        let timeColor = '#c9d1d9'; // Light gray standard

        if (isBest) {
          if (isRaceBest) {
            // Race best = purple
            numColor = '#a855f7';
            timeColor = '#a855f7';
          } else {
            // Personal best = green
            numColor = '#adff2f';
            timeColor = '#adff2f';
          }
        }

        return `
          <div class="d-flex align-items-center justify-content-between" style="padding: 0.6rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <div style="font-weight: 700; color: ${numColor}; font-size: 2.8rem; font-family: 'Courier New', monospace;">
              ${lapNum}
            </div>
            <div style="font-family: 'Courier New', monospace; font-size: 4.0rem; font-weight: 700; color: ${timeColor}; line-height: 1.2; text-align: right;">
              ${timeStr}
            </div>
          </div>
        `;
      }).reverse().join('');

      let activeRowHtml = '';
      if (this._firstLapMarked && this._activeLapNum > 0) {
        activeRowHtml = `
          <div class="d-flex align-items-center justify-content-between" style="padding: 0.6rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.06); background-color: rgba(255,140,0,0.03);">
            <div style="font-weight: 700; color: #ff8c00; font-size: 2.8rem; font-family: 'Courier New', monospace;">
              ${this._activeLapNum}
            </div>
            <div id="active-lap-time" style="font-family: 'Courier New', monospace; font-size: 4.0rem; font-weight: 700; color: #ff8c00; line-height: 1.2; text-align: right;">
              0.0000
            </div>
          </div>
        `;
      }

      rowsHtml = activeRowHtml + finishedLapsHtml;
    }

    this.innerHTML = `
      <div class="d-flex flex-column h-100" style="background-color: #0f1115;">
        <!-- Header -->
        <div class="d-flex align-items-center justify-content-between" style="padding: 0.6rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
          <div style="font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #6c757d;">#</div>
          <div style="font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #6c757d;">
            ${window.t('realtime_quali.pilot_panel.time') || 'TIME'}
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

customElements.define('quali-laps', QualiLaps);
