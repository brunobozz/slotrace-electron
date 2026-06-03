class QualiDriverPanel extends HTMLElement {
  connectedCallback() {
    this._driver = null;
    this._qualiRecord = null;
    this.render();

    this._langListener = () => {
      this.render();
    };
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  setData({ driver, qualiRecord, overallBestTime }) {
    this._driver = driver || null;
    this._qualiRecord = qualiRecord || null;
    this._overallBestTime = overallBestTime || 0;
    this.render();
  }

  _formatTime(seconds) {
    if (seconds == null || isNaN(seconds)) return '--.--.----';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(4);
    const paddedSecs = secs.padStart(7, '0');
    return mins > 0 ? `${String(mins).padStart(2, '0')}:${paddedSecs}` : paddedSecs;
  }

  render() {
    const driver = this._driver;
    const record = this._qualiRecord;

    const pilotName = driver ? (driver.nickname || driver.name || '--') : '--';
    const laps = record ? (record.laps ?? '--') : '--';
    const bestTimeVal = record && record.bestLapTime ? parseFloat(record.bestLapTime) : 0;
    const bestTime = bestTimeVal > 0 ? this._formatTime(bestTimeVal) : '--.--.----';

    // Current lap time: last element in lapTimes array
    let currentTime = '--.--.----';
    if (record && record.lapTimes && record.lapTimes.length > 0) {
      currentTime = this._formatTime(record.lapTimes[record.lapTimes.length - 1]);
    }

    const labelPilot = window.t('realtime_quali.pilot_panel.pilot') || 'PILOT';
    const labelTime = window.t('realtime_quali.pilot_panel.time') || 'TIME';
    const labelLaps = window.t('realtime_quali.pilot_panel.laps') || 'LAPS';
    const labelBest = window.t('realtime_quali.pilot_panel.best') || 'BEST';

    // Best time color logic
    let bestTimeColor = '#fff';
    if (bestTimeVal > 0) {
      const isRaceBest = this._overallBestTime > 0 && Math.abs(bestTimeVal - this._overallBestTime) < 0.0001;
      bestTimeColor = isRaceBest ? '#a855f7' : '#adff2f';
    }

    this.innerHTML = `
      <div class="quali-driver-panel d-flex flex-column justify-content-between h-100" style="background-color: #0f1115; padding: 1.5rem 2.5rem;">

        <!-- Pilot -->
        <div class="d-flex flex-column flex-grow-1 justify-content-center" style="border-bottom: 1px solid rgba(255,255,255,0.06); padding: 1rem 0;">
          <div style="font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: #8b949e;">
            ${labelPilot}
          </div>
          <div class="d-flex align-items-center justify-content-center flex-grow-1" style="font-size: 3.5rem; font-weight: 800; color: #fff; line-height: 1.2;">
            ${pilotName}
          </div>
        </div>

        <!-- Time -->
        <div class="d-flex flex-column flex-grow-1 justify-content-center" style="border-bottom: 1px solid rgba(255,255,255,0.06); padding: 1rem 0;">
          <div style="font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: #8b949e;">
            ${labelTime}
          </div>
          <div class="d-flex align-items-center justify-content-center flex-grow-1" style="font-size: 5.5rem; font-weight: 700; color: #fff; font-family: 'Courier New', monospace; line-height: 1;">
            ${currentTime}
          </div>
        </div>

        <!-- Best -->
        <div class="d-flex flex-column flex-grow-1 justify-content-center" style="border-bottom: 1px solid rgba(255,255,255,0.06); padding: 1rem 0;">
          <div style="font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: #8b949e;">
            ${labelBest}
          </div>
          <div class="d-flex align-items-center justify-content-center flex-grow-1" style="font-size: 5.5rem; font-weight: 700; color: ${bestTimeColor}; font-family: 'Courier New', monospace; line-height: 1;">
            ${bestTime}
          </div>
        </div>

        <!-- Laps -->
        <div class="d-flex flex-column flex-grow-1 justify-content-center" style="padding: 1rem 0;">
          <div style="font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: #8b949e;">
            ${labelLaps}
          </div>
          <div class="d-flex align-items-center justify-content-center flex-grow-1" style="font-size: 5.5rem; font-weight: 700; color: #fff; font-family: 'Courier New', monospace; line-height: 1;">
            ${laps}
          </div>
        </div>

      </div>
    `;
  }
}

customElements.define('quali-driver-panel', QualiDriverPanel);
