class SlotRaceRealtimeQuali extends HTMLElement {
  connectedCallback() {
    this.race = null;
    this.drivers = [];
    this.tracks = [];

    // Session state
    this._state = "idle"; // idle | qualifying | paused | interval | finished
    this._sessionConfig = { timePerPilot: 60, lane: 1, interval: 10 };
    this._pilotQueue = []; // Ordered list of pilot IDs waiting to qualify
    this._currentPilotId = null; // Pilot currently qualifying
    this._lapStartTime = null; // performance.now() when current lap started
    this._pausedState = null; // Which state to resume to after pause
    this._firstLapMarked = false; // First click only starts the lap, no time recorded

    this._goQualifyListener = (e) => {
      const { race } = e.detail;
      this.race = race;
      this.loadDataAndRender();
    };
    window.addEventListener("requestGoQualify", this._goQualifyListener);

    // Session control events
    this._onStart = (e) => this._handleStart(e.detail);
    this._onPause = () => this._handlePause();
    this._onResume = () => this._handleResume();
    this._onMarkLap = () => this._handleMarkLap();
    this._onFinish = () => this._handleFinish();
    this._onLaneChanged = (e) => {
      this._sessionConfig.lane = e.detail.lane;
      this._updateQueue();
      this._updateDriverPanel();
    };
    this._onConfigChanged = (e) => this._handleConfigChanged(e.detail);

    window.addEventListener("qualiSessionStart", this._onStart);
    window.addEventListener("qualiSessionPause", this._onPause);
    window.addEventListener("qualiSessionResume", this._onResume);
    window.addEventListener("qualiMarkLap", this._onMarkLap);
    window.addEventListener("qualiSessionFinish", this._onFinish);
    window.addEventListener("qualiLaneChanged", this._onLaneChanged);
    window.addEventListener("qualiConfigChanged", this._onConfigChanged);

    // Running lap timer loop
    this._runningLoopActive = true;
    this._startRunningLoop();
  }

  disconnectedCallback() {
    this._runningLoopActive = false;
    if (this._goQualifyListener) {
      window.removeEventListener("requestGoQualify", this._goQualifyListener);
    }
    window.removeEventListener("qualiSessionStart", this._onStart);
    window.removeEventListener("qualiSessionPause", this._onPause);
    window.removeEventListener("qualiSessionResume", this._onResume);
    window.removeEventListener("qualiMarkLap", this._onMarkLap);
    window.removeEventListener("qualiSessionFinish", this._onFinish);
    window.removeEventListener("qualiLaneChanged", this._onLaneChanged);
    window.removeEventListener("qualiConfigChanged", this._onConfigChanged);
    if (this._autoSaveTimeout) {
      clearTimeout(this._autoSaveTimeout);
    }
  }

  _startRunningLoop() {
    const tick = () => {
      if (!this._runningLoopActive) return;

      if (
        this._state === "qualifying" &&
        this._firstLapMarked &&
        this._lapStartTime &&
        !this._pausedState
      ) {
        const elapsed = (performance.now() - this._lapStartTime) / 1000;
        const lapsEl = this.querySelector("quali-laps");
        if (lapsEl) {
          lapsEl.updateRunningTime(elapsed);
        }
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async loadDataAndRender() {
    try {
      this.drivers = (await window.electronAPI.db.get("drivers")) || [];
      this.tracks = (await window.electronAPI.db.get("tracks")) || [];
    } catch (e) {
      this.drivers = [];
      this.tracks = [];
    }
    this._resetSession();
    this.render();
    this.showModal();
    this.distributeData();
  }

  _resetSession() {
    this._state = "idle";
    this._lapStartTime = null;
    this._pausedState = null;
    this._firstLapMarked = false;
    this._pauseTimeStart = null;

    // Load initial values from the race object if present, else default
    this._sessionConfig = {
      timePerPilot:
        this.race?.timePerPilot !== undefined ? this.race.timePerPilot : 60,
      lane: this.race?.lane !== undefined ? this.race.lane : 1,
      interval: this.race?.interval !== undefined ? this.race.interval : 10,
    };

    // Initialize pilot queue and current pilot from race.pilots order
    const racePilots = this.race && this.race.pilots ? this.race.pilots : [];
    this._pilotQueue = racePilots.map((p) =>
      typeof p === "object" ? p.id : p,
    );

    if (this._pilotQueue.length > 0) {
      this._currentPilotId = this._pilotQueue.shift();
    } else {
      this._currentPilotId = null;
    }
  }

  getTrackForRace() {
    if (!this.race || !this.race.trackId) return null;
    return this.tracks.find((t) => t.id === this.race.trackId) || null;
  }

  _getDriver(pilotId) {
    return this.drivers.find((d) => d.id === pilotId) || null;
  }

  _getQualiRecord(pilotId) {
    if (!this.race || !this.race.quali) return null;
    return this.race.quali.find((q) => q.pilotId === pilotId) || null;
  }

  // ─── STATE MACHINE ────────────────────────────────────

  _handleStart(detail) {
    if (this._state !== "idle") return;

    this._sessionConfig = {
      timePerPilot: detail.timePerPilot || 60,
      lane: detail.lane || 1,
      interval: detail.interval || 10,
    };

    if (this.race) {
      this.race.timePerPilot = this._sessionConfig.timePerPilot;
      this.race.lane = this._sessionConfig.lane;
      this.race.interval = this._sessionConfig.interval;
    }

    // Ensure quali records exist for all pilots
    if (!this.race.quali) this.race.quali = [];
    const allPilotIds = (this.race.pilots || []).map((p) =>
      typeof p === "object" ? p.id : p,
    );
    allPilotIds.forEach((pilotId) => {
      const exists = this.race.quali.find((q) => q.pilotId === pilotId);
      if (!exists) {
        this.race.quali.push({
          pilotId,
          laps: 0,
          bestLapIndex: 0,
          bestLapTime: 0,
          lapTimes: [],
        });
      }
    });

    this._startNextPilot(true); // isFirst = true, don't shift queue since we already have the first pilot active
  }

  _startNextPilot(isFirst = false) {
    if (!isFirst) {
      if (this._pilotQueue.length === 0) {
        this._state = "finished";
        this._currentPilotId = null;
        this._updateToolbarState();
        this._updateDriverPanel();
        this._updateLaps();
        this._updateQueue();
        const timer = this.querySelector("slotrace-timer");
        if (timer) timer.reset();
        return;
      }
      this._currentPilotId = this._pilotQueue.shift();
    } else {
      if (!this._currentPilotId) {
        this._state = "finished";
        this._updateToolbarState();
        this._updateDriverPanel();
        this._updateLaps();
        this._updateQueue();
        const timer = this.querySelector("slotrace-timer");
        if (timer) timer.reset();
        return;
      }
    }

    this._state = "qualifying";
    this._lapStartTime = null;
    this._firstLapMarked = false;

    // Start countdown timer
    const timer = this.querySelector("slotrace-timer");
    if (timer) {
      timer.setColor("#adff2f");
      timer.startCountdown(this._sessionConfig.timePerPilot, () => {
        this._onPilotTimeUp();
      });
    }

    this._updateToolbarState();
    this._updateDriverPanel();
    this._updateLaps();
    this._updateStandings();
    this._updateQueue();
  }

  _onPilotTimeUp() {
    // Pilot's time is up — recalculate their metrics
    this._recalcQuali(this._currentPilotId);
    this._updateStandings();

    const intervalTime = this._sessionConfig.interval;
    if (intervalTime > 0 && this._pilotQueue.length > 0) {
      // Shift the next pilot now so they show up in panels and get removed from queue
      this._currentPilotId = this._pilotQueue.shift();

      // Start interval countdown
      this._state = "interval";
      this._updateToolbarState();
      this._updateDriverPanel();
      this._updateLaps();
      this._updateQueue();

      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.setColor("#ffc107"); // yellow timer for interval
        timer.startCountdown(intervalTime, () => {
          this._startNextPilot(true); // isFirst = true, don't shift queue again
        });
      }
    } else {
      // No interval or no more pilots — go directly to next
      this._startNextPilot(false);
    }
  }

  _handlePause() {
    if (this._state !== "qualifying" && this._state !== "interval") return;

    this._pausedState = this._state;
    this._state = "paused";
    this._pauseTimeStart = performance.now();

    const timer = this.querySelector("slotrace-timer");
    if (timer) timer.pause();

    this._updateToolbarState();
  }

  _handleResume() {
    if (this._state !== "paused") return;

    this._state = this._pausedState || "qualifying";
    this._pausedState = null;

    // Adjust lap start time by paused duration to prevent drift
    if (this._pauseTimeStart && this._lapStartTime) {
      const pausedDuration = performance.now() - this._pauseTimeStart;
      this._lapStartTime += pausedDuration;
    }
    this._pauseTimeStart = null;

    const timer = this.querySelector("slotrace-timer");
    if (timer) {
      if (this._state === "qualifying") {
        timer.setColor("#adff2f");
      } else {
        timer.setColor("#ffc107");
      }
      timer.resume();
    }

    this._updateToolbarState();
  }

  _handleMarkLap() {
    if (this._state !== "qualifying" || !this._currentPilotId) return;

    const now = performance.now();

    // First click only starts the lap (car is too close to sensor at start)
    if (!this._firstLapMarked) {
      this._firstLapMarked = true;
      this._lapStartTime = now;
      this._updateLaps();
      return;
    }

    const lapTime = (now - this._lapStartTime) / 1000; // seconds
    this._lapStartTime = now; // reset for next lap

    // Add lap time to quali record
    const record = this._getQualiRecord(this._currentPilotId);
    if (record) {
      record.lapTimes.push(parseFloat(lapTime.toFixed(4)));
      record.laps = record.lapTimes.length;
      this._recalcQuali(this._currentPilotId);
    }

    this._updateDriverPanel();
    this._updateLaps();
    this._updateStandings();
  }

  _getOverallBestTime() {
    if (!this.race || !this.race.quali) return 0;
    let best = 0;
    this.race.quali.forEach((q) => {
      const t = parseFloat(q.bestLapTime) || 0;
      if (t > 0 && (best === 0 || t < best)) best = t;
    });
    return best;
  }

  async _handleFinish() {
    if (this._state !== "finished") return;

    // Save quali data back to the race in the database
    try {
      const races = (await window.electronAPI.db.get("races")) || [];
      const raceIdx = races.findIndex((r) => r.id === this.race.id);
      if (raceIdx >= 0) {
        races[raceIdx].quali = this.race.quali;
        await window.electronAPI.db.set("races", races);
      }
    } catch (e) {
      console.error("Error saving quali data:", e);
    }

    // Close modal
    const modalEl = this.querySelector("#modal-realtime-quali");
    if (modalEl) {
      const modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (modalInstance) modalInstance.hide();
    }

    // Notify race list and edit modal to refresh
    window.dispatchEvent(
      new CustomEvent("raceQualiUpdated", { detail: { race: this.race } }),
    );
    window.dispatchEvent(new CustomEvent("raceListChanged"));
    this._resetSession();
  }

  _recalcQuali(pilotId) {
    const record = this._getQualiRecord(pilotId);
    if (!record) return;

    record.laps = record.lapTimes.length;
    let minTime = 0,
      minIndex = 0;
    record.lapTimes.forEach((time, idx) => {
      const val = parseFloat(time) || 0;
      if (val > 0 && (minTime === 0 || val < minTime)) {
        minTime = val;
        minIndex = idx + 1;
      }
    });
    record.bestLapTime = minTime;
    record.bestLapIndex = minIndex;
  }

  // ─── UI UPDATES ────────────────────────────────────────

  _updateToolbarState() {
    const toolbar = this.querySelector("quali-toolbar");
    if (toolbar) toolbar.setState(this._state);
  }

  _updateDriverPanel() {
    const panel = this.querySelector("quali-driver-panel");
    if (!panel) return;

    const lane = this._sessionConfig.lane || 1;
    const track = this.getTrackForRace();
    const laneColors = track ? track.laneColors : null;

    if (this._currentPilotId) {
      const driver = this._getDriver(this._currentPilotId);
      const record = this._getQualiRecord(this._currentPilotId);
      const overallBest = this._getOverallBestTime();
      panel.setData({
        driver,
        qualiRecord: record,
        overallBestTime: overallBest,
        lane,
        laneColors,
      });
    } else {
      panel.setData({
        driver: null,
        qualiRecord: null,
        overallBestTime: 0,
        lane,
        laneColors,
      });
    }
  }

  _updateLaps() {
    const lapsEl = this.querySelector("quali-laps");
    if (!lapsEl) return;

    const overallBest = this._getOverallBestTime();

    if (this._currentPilotId) {
      const record = this._getQualiRecord(this._currentPilotId);
      const lapTimes = record ? record.lapTimes : [];
      lapsEl.setData({
        lapTimes,
        overallBestTime: overallBest,
        activeLapNum: lapTimes.length + 1,
        firstLapMarked: this._firstLapMarked,
      });
    } else {
      lapsEl.setData({
        lapTimes: [],
        overallBestTime: overallBest,
        activeLapNum: 0,
        firstLapMarked: false,
      });
    }
  }

  _updateStandings() {
    const standings = this.querySelector("quali-standings");
    if (standings && this.race) {
      standings.setData({
        quali: this.race.quali || [],
        drivers: this.drivers,
      });
    }
  }

  _updateQueue() {
    const queue = this.querySelector("quali-queue");
    if (!queue) return;

    // Convert remaining queue IDs to pilot objects
    const pendingPilots = this._pilotQueue.map((id) => {
      const pilot = (this.race.pilots || []).find(
        (p) => (typeof p === "object" ? p.id : p) === id,
      );
      return typeof pilot === "object"
        ? pilot
        : { id: pilot || id, carId: null };
    });
    const track = this.getTrackForRace();
    const laneColors = track ? track.laneColors : null;
    queue.setData({
      pendingPilots,
      drivers: this.drivers,
      lane: this._sessionConfig.lane || 1,
      laneColors,
    });
  }

  // ─── INITIAL DISTRIBUTION ──────────────────────────────

  distributeData() {
    if (!this.race) return;

    const toolbar = this.querySelector("quali-toolbar");
    if (toolbar) {
      toolbar.setData({ race: this.race, track: this.getTrackForRace() });
    }

    if (!this.race.quali) this.race.quali = [];

    const racePilots = this.race.pilots || [];
    racePilots.forEach((pilot) => {
      const pilotId = typeof pilot === "object" ? pilot.id : pilot;
      const exists = this.race.quali.find((q) => q.pilotId === pilotId);
      if (!exists) {
        this.race.quali.push({
          pilotId,
          laps: 0,
          bestLapIndex: 0,
          bestLapTime: 0,
          lapTimes: [],
        });
      }
    });

    this._updateDriverPanel();
    this._updateLaps();
    this._updateStandings();

    const queue = this.querySelector("quali-queue");
    if (queue) {
      const allPilots = racePilots.map((p) =>
        typeof p === "object" ? p : { id: p, carId: null },
      );
      const track = this.getTrackForRace();
      const laneColors = track ? track.laneColors : null;
      queue.setData({
        pendingPilots: allPilots,
        drivers: this.drivers,
        lane: this._sessionConfig.lane || 1,
        laneColors,
      });
    }
  }

  _handleConfigChanged(detail) {
    if (!this.race) return;

    this._sessionConfig.timePerPilot = detail.timePerPilot;
    this._sessionConfig.interval = detail.interval;
    this._sessionConfig.lane = detail.lane;

    this.race.timePerPilot = detail.timePerPilot;
    this.race.interval = detail.interval;
    this.race.lane = detail.lane;

    this._triggerAutoSave();
  }

  _triggerAutoSave() {
    if (this._autoSaveTimeout) {
      clearTimeout(this._autoSaveTimeout);
    }
    this._autoSaveTimeout = setTimeout(async () => {
      if (!this.race) return;
      try {
        const races = (await window.electronAPI.db.get("races")) || [];
        const raceIdx = races.findIndex((r) => r.id === this.race.id);
        if (raceIdx >= 0) {
          races[raceIdx].timePerPilot = this.race.timePerPilot;
          races[raceIdx].interval = this.race.interval;
          races[raceIdx].lane = this.race.lane;
          // Also save quali data in case any lap time changed or was modified
          races[raceIdx].quali = this.race.quali;

          await window.electronAPI.db.set("races", races);
          console.log("Quali session config auto-saved successfully!");
        }
      } catch (e) {
        console.error("Failed to auto-save quali config:", e);
      }
    }, 2000);
  }

  showModal() {
    const modalEl = this.querySelector("#modal-realtime-quali");
    if (modalEl) {
      let modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalEl);
      }
      modalInstance.show();
    }
  }

  render() {
    if (!this.race) {
      this.innerHTML = "";
      return;
    }

    const raceName = this.race.name || "";

    this.innerHTML = `
      <div class="modal fade" id="modal-realtime-quali" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content border-0 text-white d-flex flex-column h-100">
            
            <!-- Header section -->
            <div class="modal-header border-bottom border-secondary-subtle px-4 py-0 d-flex align-items-center justify-content-between">
              
              <!-- Left: Logo -->
              <slotrace-logo></slotrace-logo>

              <!-- Center: Race Name & QUALIFICAÇÃO -->
              <div class="text-center flex-grow-1 mx-3">
                <h2 class="fw-bold mb-0 text-uppercase text-body-secondary tracking-wider fs-2" style="letter-spacing: 0.05em;">
                  ${raceName}
                </h2>
                <div class="text-primary fw-semibold tracking-widest mt-0.5" style="font-size: 0.8rem; letter-spacing: 0.25em;">
                  QUALIFICAÇÃO
                </div>
              </div>

              <!-- Right: Timer & Close button -->
              <div class="d-flex align-items-center gap-3">
                <slotrace-timer></slotrace-timer>
                <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close" style="outline: none; box-shadow: none;"></button>
              </div>

            </div>

            <!-- Toolbar section -->
            <quali-toolbar></quali-toolbar>

            <!-- Content area: 2 columns -->
            <div class="modal-body flex-grow-1 p-0 d-flex overflow-hidden">
              
              <!-- Left Column: Driver Panel + Laps (side by side) -->
              <div class="d-flex flex-row h-100 flex-grow-1">
                <quali-driver-panel class="overflow-auto h-100" style="width: 50%;"></quali-driver-panel>
                <quali-laps class="overflow-auto h-100" style="width: 50%;"></quali-laps>
              </div>

              <!-- Right Column: Standings + Queue -->
              <div class="d-flex flex-column h-100" style="width: 30%; min-width: 320px;">
                <quali-standings class="overflow-hidden" style="flex: 1; min-height: 0;"></quali-standings>
                <quali-queue class="overflow-hidden" style="flex: 1; min-height: 0;"></quali-queue>
              </div>

            </div>

          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("slotrace-realtime-quali", SlotRaceRealtimeQuali);
