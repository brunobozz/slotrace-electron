class SlotRaceTimer extends HTMLElement {
  constructor() {
    super();
    this.seconds = 0;
    this.timerId = null;
    this._mode = 'up'; // 'up' or 'down'
    this._onFinish = null;
    this._onTick = null;
  }

  connectedCallback() {
    this.innerHTML = `
      <span class="font-monospace fw-bold" id="timer-display" style="font-size: 2.8rem; color: #adff2f !important; text-shadow: 0 0 10px rgba(173, 255, 47, 0.25); letter-spacing: 0.05em;">00:00:00</span>
    `;
  }

  disconnectedCallback() {
    this.stop();
  }

  /**
   * Start counting up from 0
   */
  start() {
    this.stop();
    this._mode = 'up';
    this.seconds = 0;
    this.updateDisplay();
    this.timerId = setInterval(() => {
      this.seconds++;
      this.updateDisplay();
      if (this._onTick) this._onTick(this.seconds);
    }, 1000);
  }

  /**
   * Start counting down from a given number of seconds
   * @param {number} fromSeconds - seconds to count down from
   * @param {Function} onFinish - callback when timer reaches 0
   */
  startCountdown(fromSeconds, onFinish) {
    this.stop();
    this._mode = 'down';
    this.seconds = fromSeconds;
    this._onFinish = onFinish || null;
    this.updateDisplay();
    this.timerId = setInterval(() => {
      this.seconds--;
      this.updateDisplay();
      if (this._onTick) this._onTick(this.seconds);
      if (this.seconds <= 0) {
        this.stop();
        if (this._onFinish) this._onFinish();
      }
    }, 1000);
  }

  /**
   * Pause the timer (keeps current seconds)
   */
  pause() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Resume after pause
   */
  resume() {
    if (this.timerId) return; // already running
    if (this._mode === 'down') {
      this.timerId = setInterval(() => {
        this.seconds--;
        this.updateDisplay();
        if (this._onTick) this._onTick(this.seconds);
        if (this.seconds <= 0) {
          this.stop();
          if (this._onFinish) this._onFinish();
        }
      }, 1000);
    } else {
      this.timerId = setInterval(() => {
        this.seconds++;
        this.updateDisplay();
        if (this._onTick) this._onTick(this.seconds);
      }, 1000);
    }
  }

  /**
   * Stop and clear interval
   */
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Reset display to 00:00:00
   */
  reset() {
    this.stop();
    this.seconds = 0;
    this._onFinish = null;
    this.updateDisplay();
  }

  isRunning() {
    return this.timerId !== null;
  }

  setColor(color) {
    const display = this.querySelector('#timer-display');
    if (display) {
      display.style.color = color + ' !important';
      display.style.textShadow = `0 0 10px ${color}40`;
    }
  }

  updateDisplay() {
    const display = this.querySelector('#timer-display');
    if (!display) return;

    const totalSecs = Math.max(0, this.seconds);
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');

    display.textContent = `${hrs}:${mins}:${secs}`;
  }
}
customElements.define('slotrace-timer', SlotRaceTimer);
