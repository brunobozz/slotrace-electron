class QualiToolbar extends HTMLElement {
  connectedCallback() {
    this._race = null;
    this._track = null;
    this._state = 'idle'; // idle | qualifying | paused | interval

    this._langListener = () => {
      this.render();
    };
    window.addEventListener('languageChanged', this._langListener);

    this.render();
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
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
    let laneOptions = '';
    for (let i = 1; i <= laneCount; i++) {
      laneOptions += `<option value="${i}">${i}</option>`;
    }

    const hasPilots = this._hasPilots();
    const isIdle = this._state === 'idle';
    const startDisabled = (!hasPilots && isIdle) ? 'disabled' : '';

    this.innerHTML = `
      <div class="quali-toolbar d-flex align-items-center justify-content-between px-3" style="background-color: #1a1d23; height: 50px; border-bottom: 1px solid rgba(255,255,255,0.08);">

        <!-- Left: Fields -->
        <div class="d-flex align-items-center gap-3">

          <!-- Time per pilot -->
          <div class="d-flex align-items-center gap-1">
            <label class="text-secondary mb-0" style="font-size: 0.75rem; white-space: nowrap;">
              ${window.t('realtime_quali.toolbar.time_per_pilot') || 'Time (per pilot)'}
            </label>
            <div class="d-flex align-items-center">
              <input type="number" id="quali-time" class="form-control form-control-sm bg-dark text-white border-secondary-subtle text-center" min="1" step="1" value="60" style="width: 64px; font-size: 0.8rem; box-shadow: none;">
              <span class="text-secondary ms-1" style="font-size: 0.75rem;">s</span>
            </div>
          </div>

          <!-- Lane -->
          <div class="d-flex align-items-center gap-1">
            <label class="text-secondary mb-0" style="font-size: 0.75rem; white-space: nowrap;">
              ${window.t('realtime_quali.toolbar.lane') || 'Lane'}
            </label>
            <select id="quali-lane" class="form-select form-select-sm bg-dark text-white border-secondary-subtle" style="width: 64px; font-size: 0.8rem; box-shadow: none;">
              ${laneOptions}
            </select>
          </div>

          <!-- Interval -->
          <div class="d-flex align-items-center gap-1">
            <label class="text-secondary mb-0" style="font-size: 0.75rem; white-space: nowrap;">
              ${window.t('realtime_quali.toolbar.interval') || 'Interval'}
            </label>
            <div class="d-flex align-items-center">
              <input type="number" id="quali-interval" class="form-control form-control-sm bg-dark text-white border-secondary-subtle text-center" min="0" step="1" value="10" style="width: 64px; font-size: 0.8rem; box-shadow: none;">
              <span class="text-secondary ms-1" style="font-size: 0.75rem;">s</span>
            </div>
          </div>

        </div>

        <!-- Right: Action buttons -->
        <div class="d-flex align-items-center gap-2">

          <!-- Mark Lap button -->
          <button id="btn-quali-lap" class="btn btn-sm fw-semibold d-flex align-items-center gap-1 px-3 d-none" style="background-color: #ff8c00; color: #fff; font-size: 0.85rem;">
            <i class="mdi mdi-flag-checkered"></i>
            ${window.t('realtime_quali.toolbar.mark_lap') || 'Mark Lap'}
          </button>

          <!-- Pause button -->
          <button id="btn-quali-pause" class="btn btn-sm fw-semibold d-flex align-items-center gap-1 px-3 d-none" style="background-color: #ffc107; color: #212529; font-size: 0.85rem;">
            <i class="mdi mdi-pause"></i>
            ${window.t('realtime_quali.toolbar.pause') || 'Pause'}
          </button>

          <!-- Start / Resume button -->
          <button id="btn-quali-start" class="btn btn-sm fw-semibold d-flex align-items-center gap-1 px-3" style="background-color: #28a745; color: #fff; font-size: 0.85rem;" ${startDisabled}>
            <i class="mdi mdi-play"></i>
            ${window.t('realtime_quali.toolbar.start') || 'Start'}
          </button>

          <!-- Finish button -->
          <button id="btn-quali-finish" class="btn btn-sm fw-semibold d-flex align-items-center gap-1 px-3 d-none" style="background-color: #0d6efd; color: #fff; font-size: 0.85rem;">
            <i class="mdi mdi-check-all"></i>
            ${window.t('realtime_quali.toolbar.finish') || 'Finish'}
          </button>

        </div>

      </div>
    `;

    this._bindEvents();
    this._updateButtons();
  }

  _bindEvents() {
    const btnStart = this.querySelector('#btn-quali-start');
    const btnPause = this.querySelector('#btn-quali-pause');
    const btnLap = this.querySelector('#btn-quali-lap');

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        if (this._state === 'idle') {
          const timePerPilot = parseInt(this.querySelector('#quali-time')?.value) || 60;
          const lane = parseInt(this.querySelector('#quali-lane')?.value) || 1;
          const interval = parseInt(this.querySelector('#quali-interval')?.value) || 10;
          window.dispatchEvent(new CustomEvent('qualiSessionStart', {
            detail: { timePerPilot, lane, interval }
          }));
        } else if (this._state === 'paused') {
          window.dispatchEvent(new CustomEvent('qualiSessionResume'));
        }
      });
    }

    if (btnPause) {
      btnPause.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('qualiSessionPause'));
      });
    }

    if (btnLap) {
      btnLap.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('qualiMarkLap'));
      });
    }

    const btnFinish = this.querySelector('#btn-quali-finish');
    if (btnFinish) {
      btnFinish.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('qualiSessionFinish'));
      });
    }

    const laneSelect = this.querySelector('#quali-lane');
    if (laneSelect) {
      laneSelect.addEventListener('change', () => {
        window.dispatchEvent(new CustomEvent('qualiLaneChanged', {
          detail: { lane: parseInt(laneSelect.value) || 1 }
        }));
      });
    }
  }

  _updateButtons() {
    const btnStart = this.querySelector('#btn-quali-start');
    const btnPause = this.querySelector('#btn-quali-pause');
    const btnLap = this.querySelector('#btn-quali-lap');
    const btnFinish = this.querySelector('#btn-quali-finish');
    const inputs = this.querySelectorAll('#quali-time, #quali-lane, #quali-interval');

    if (!btnStart) return;

    const hasPilots = this._hasPilots();

    switch (this._state) {
      case 'idle':
        btnStart.classList.remove('d-none');
        btnStart.disabled = !hasPilots;
        btnStart.querySelector('i').className = 'mdi mdi-play';
        btnStart.querySelector('i').nextSibling.textContent = ' ' + (window.t('realtime_quali.toolbar.start') || 'Start');
        btnPause?.classList.add('d-none');
        btnLap?.classList.add('d-none');
        btnFinish?.classList.add('d-none');
        inputs.forEach(el => el.disabled = false);
        break;

      case 'qualifying':
        btnStart.classList.add('d-none');
        btnPause?.classList.remove('d-none');
        btnLap?.classList.remove('d-none');
        btnFinish?.classList.add('d-none');
        inputs.forEach(el => el.disabled = true);
        break;

      case 'paused':
        btnStart.classList.remove('d-none');
        btnStart.disabled = false;
        btnStart.querySelector('i').className = 'mdi mdi-play';
        btnStart.querySelector('i').nextSibling.textContent = ' ' + (window.t('realtime_quali.toolbar.resume') || 'Resume');
        btnPause?.classList.add('d-none');
        btnLap?.classList.add('d-none');
        btnFinish?.classList.add('d-none');
        inputs.forEach(el => el.disabled = true);
        break;

      case 'interval':
        btnStart.classList.add('d-none');
        btnPause?.classList.remove('d-none');
        btnLap?.classList.add('d-none');
        btnFinish?.classList.add('d-none');
        inputs.forEach(el => el.disabled = true);
        break;

      case 'finished':
        btnStart.classList.add('d-none');
        btnPause?.classList.add('d-none');
        btnLap?.classList.add('d-none');
        btnFinish?.classList.remove('d-none');
        inputs.forEach(el => el.disabled = true);
        break;
    }
  }
}

customElements.define('quali-toolbar', QualiToolbar);
