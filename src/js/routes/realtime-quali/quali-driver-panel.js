function getLaneColor(lane) {
  const colors = {
    1: '#ff3b30', // Red
    2: '#007aff', // Blue
    3: '#34c759', // Green
    4: '#ffcc00', // Yellow
    5: '#ff9500', // Orange
    6: '#ffffff', // White
    7: '#af52de', // Purple
    8: '#8e8e93'  // Grey
  };
  return colors[lane] || '#8e8e93';
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
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  setData({ driver, qualiRecord, overallBestTime, lane }) {
    this._driver = driver || null;
    this._qualiRecord = qualiRecord || null;
    this._overallBestTime = overallBestTime || 0;
    this._lane = lane || 1;
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

    let pilotName = '--';
    if (driver) {
      const baseName = driver.name ? driver.name : (driver.nickname || '');
      if (baseName) {
        pilotName = baseName.trim().split(/\s+/)[0];
      }
    }
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
    const labelLane = window.t('realtime_quali.toolbar.lane') || 'LANE';

    // Best time color logic
    let bestTimeColor = '#fff';
    if (bestTimeVal > 0) {
      const isRaceBest = this._overallBestTime > 0 && Math.abs(bestTimeVal - this._overallBestTime) < 0.0001;
      bestTimeColor = isRaceBest ? '#a855f7' : '#adff2f';
    }

    const laneColor = getLaneColor(this._lane);

    this.innerHTML = `
      <div class="quali-driver-panel d-flex flex-column justify-content-between h-100" style="background-color: #0f1115; padding: 0 2.5rem 1.5rem 2.5rem;">

        <!-- Pilot & Lane Info -->
        <div class="d-flex flex-row flex-grow-1" style="border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0 0 1rem 0; min-height: 0;">
          
          <!-- Pilot Info -->
          <div class="d-flex flex-column justify-content-center align-items-start" style="flex: 1; padding-right: 1.5rem; min-width: 0;">
            <div style="font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: #8b949e;">
              ${labelPilot}
            </div>
            <div class="fw-extrabold" style="font-size: 3.2rem; font-weight: 800; color: #fff; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word; text-align: left; width: 100%;">
              ${pilotName}
            </div>
          </div>

          <!-- Divider line between Pilot and Lane -->
          <div style="width: 1px; height: 70%; background-color: rgba(255,255,255,0.08); align-self: center;"></div>

          <!-- Lane Info -->
          <div class="d-flex flex-column justify-content-center align-items-center" style="width: 160px; padding-left: 1.5rem;">
            <div style="font-size: 1.2rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em; color: #8b949e; margin-bottom: 0.5rem;">
              ${labelLane}
            </div>
            <div class="d-flex align-items-center justify-content-center">
              <span style="display: inline-block; width: 80px; height: 80px; border-radius: 50%; background-color: ${laneColor}; box-shadow: 0 0 20px ${laneColor}; border: 3px solid rgba(255,255,255,0.3);"></span>
            </div>
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
