class SlotRaceRealtimeRace extends HTMLElement {
  connectedCallback() {
    this.race = null;
    this.drivers = [];
    this.cars = [];
    this.tracks = [];

    // Session status machine
    this._state = "idle"; // idle | running | paused | interval | finished
    this._pausedState = null;
    this._currentSessionIndex = 1;
    this._totalSessions = 1;
    this._lanesCount = 4;
    this._laneColors = [];
    this._laneRotation = [];

    // Telemetry tracking
    this._laneAssignments = {}; // { laneNum: pilotId }
    this._deckQueue = []; // [ pilotId ]
    this._completedLanes = {}; // { pilotId: [ laneNum ] }

    this._sessionFirstLapMarked = {}; // { pilotId: boolean }
    this._sessionLapStartTime = {}; // { pilotId: performance.now() }
    this._sessionLaps = {}; // { pilotId: number }
    this._pilotAccumulatedLapTime = {}; // { pilotId: number }
    this._pauseTimeStart = null;
    this._pilotStoppedZones = {}; // { pilotId: zone }

    this._goRaceListener = (e) => {
      const { race } = e.detail;
      const isSameRace = this.race && String(this.race.id) === String(race.id);
      const canResumeInMemory = isSameRace && this._state === "paused";
      this.race = race;
      this.loadDataAndRender(canResumeInMemory);
    };
    window.addEventListener("requestGoRace", this._goRaceListener);

    // Configuration Saved Listener
    this._configSavedListener = async (e) => {
      const { timePerLane, interval } = e.detail;
      if (this.race) {
        this.race.timePerLane = timePerLane;
        this.race.interval = interval;
        this._timePerLane = timePerLane;
        this._interval = interval;

        // Persist to database
        try {
          const races = (await window.electronAPI.db.get("races")) || [];
          const idx = races.findIndex((r) => r.id === this.race.id);
          if (idx !== -1) {
            races[idx].timePerLane = timePerLane;
            races[idx].interval = interval;
            await window.electronAPI.db.set("races", races);
            console.log(
              `[Database] Saved configurations for race: ${this.race.id}`,
            );
          }
        } catch (err) {
          console.error("Failed to save race configurations:", err);
        }

        if (this._state === "idle") {
          this.updateTimerDisplay();
        }
      }
    };

    // Auto-saved automatically on stops

    this._startListener = () => this.startSession();
    this._pauseListener = () => this.pauseSession();
    this._resumeListener = () => this.resumeSession();
    this._resetListener = () => {
      window.confirmModal({
        title: "Zerar Corrida",
        message: "Tem certeza que deseja zerar a corrida? Todas as voltas e tempos acumulados serão apagados!",
        theme: "danger",
        icon: "mdi-alert-circle",
        cancelBtnText: "Cancelar",
        confirmBtnText: "Zerar",
        confirmBtnIcon: "mdi-trash-can-outline"
      }).then((confirmed) => {
        if (confirmed) {
          this._handleResetConfirmed();
        }
      });
    };

    this._simulateLapListener = (e) => {
      const { laneNum } = e.detail;
      this.triggerLapForLane(laneNum);
    };

    this._onSensorTriggered = (e) => {
      const { lane } = e.detail;
      if (this._state === "running") {
        if (lane <= this._lanesCount) {
          this.triggerLapForLane(lane);
        }
      }
    };

    window.addEventListener("raceSessionStart", this._startListener);
    window.addEventListener("raceSessionPause", this._pauseListener);
    window.addEventListener("raceSessionResume", this._resumeListener);
    window.addEventListener("raceSessionReset", this._resetListener);
    window.addEventListener("raceConfigSaved", this._configSavedListener);
    window.addEventListener("serial-sensor-triggered", this._onSensorTriggered);
    this.addEventListener("requestSimulateLap", this._simulateLapListener);

    // Keyboard telemetry triggers (Keys 1-8)
    this._keydownListener = (e) => {
      if (
        document.activeElement &&
        (document.activeElement.tagName === "INPUT" ||
          document.activeElement.tagName === "SELECT" ||
          document.activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }
      if (this._state === "running") {
        const key = e.key;
        if (key >= "1" && key <= "8") {
          const laneNum = parseInt(key);
          if (laneNum <= this._lanesCount) {
            e.preventDefault();
            this.triggerLapForLane(laneNum);
          }
        }
      }
    };
    window.addEventListener("keydown", this._keydownListener);

    this._runningLoopActive = true;
    this._startRunningLoop();
  }

  disconnectedCallback() {
    this._runningLoopActive = false;
    window.removeEventListener("requestGoRace", this._goRaceListener);
    window.removeEventListener("raceSessionStart", this._startListener);
    window.removeEventListener("raceSessionPause", this._pauseListener);
    window.removeEventListener("raceSessionResume", this._resumeListener);
    window.removeEventListener("raceSessionReset", this._resetListener);
    window.removeEventListener("raceConfigSaved", this._configSavedListener);
    window.removeEventListener("keydown", this._keydownListener);
    window.removeEventListener("serial-sensor-triggered", this._onSensorTriggered);
    this.removeEventListener("requestSimulateLap", this._simulateLapListener);
  }

  _startRunningLoop() {
    const tick = () => {
      if (!this._runningLoopActive) return;

      if (this._state === "running") {
        const now = performance.now();
        for (let laneNum = 1; laneNum <= this._lanesCount; laneNum++) {
          const pilotId = this._laneAssignments[laneNum];
          if (
            pilotId &&
            this._sessionFirstLapMarked[pilotId] &&
            this._sessionLapStartTime[pilotId]
          ) {
            const elapsed = (now - this._sessionLapStartTime[pilotId]) / 1000;
            const displayEl = this.querySelector(
              `#lane-current-time-${laneNum}`,
            );
            if (displayEl) {
              displayEl.textContent = elapsed.toFixed(4) + "s";
            }
          }
        }
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  setupStartingRotation() {
    const quali = this.race?.quali || [];

    // Sort pilots by quali best time ascending (fastest first). Zeros at bottom.
    const sortedPilots = [...this.pilots]
      .sort((a, b) => {
        const idA = typeof a === "object" ? a.id : a;
        const idB = typeof b === "object" ? b.id : b;
        const qA = quali.find((q) => String(q.pilotId) === String(idA));
        const qB = quali.find((q) => String(q.pilotId) === String(idB));
        const timeA = qA && qA.bestLapTime > 0 ? qA.bestLapTime : Infinity;
        const timeB = qB && qB.bestLapTime > 0 ? qB.bestLapTime : Infinity;
        return timeA - timeB;
      })
      .map((p) => (typeof p === "object" ? p.id : p));

    const P = sortedPilots.length;
    const L = this._lanesCount;

    this._laneAssignments = {};
    this._deckQueue = [];
    this._completedLanes = {};

    if (P <= L) {
      // Pilots <= Lanes: align directly on 1..P
      for (let i = 0; i < L; i++) {
        const laneNum = i + 1;
        this._laneAssignments[laneNum] = sortedPilots[i] || null;
      }
    } else {
      // Pilots > Lanes: Last L pilots start on track lanes 1..L
      const trackPilots = sortedPilots.slice(P - L);
      for (let i = 0; i < L; i++) {
        const laneNum = i + 1;
        this._laneAssignments[laneNum] = trackPilots[i];
      }

      // First P - L pilots go to DECK in reverse queue order
      const deckPilots = sortedPilots.slice(0, P - L);
      this._deckQueue = [...deckPilots].reverse();
    }

    // Init tracking structures
    this.pilots.forEach((p) => {
      const pid = typeof p === "object" ? p.id : p;
      this._completedLanes[pid] = [];
    });
  }

  async _handleResetConfirmed() {
    if (this.race) {
      this.race.raceSession = [];
      this.race.activeSessionState = null;
      try {
        const races = (await window.electronAPI.db.get("races")) || [];
        const idx = races.findIndex((r) => r.id === this.race.id);
        if (idx !== -1) {
          races[idx].raceSession = [];
          races[idx].activeSessionState = null;
          await window.electronAPI.db.set("races", races);
          console.log(
            `[Database] Cleared race results for reset ID: ${this.race.id}`,
          );
        }
      } catch (err) {
        console.error("Failed to clear database results on reset:", err);
      }
    }

    this.resetSession(true, false);
  }

  resetSession(renderFlag = true, preserveExisting = false) {
    this._state = "idle";
    this._pausedState = null;
    this._currentSessionIndex = 1;
    this._pauseTimeStart = null;
    this._pilotStoppedZones = {};
    if (!preserveExisting) {
      this._pilotAccumulatedLapTime = {};
    }

    this.setupStartingRotation();

    if (
      preserveExisting &&
      this.race?.raceSession &&
      this.race.raceSession.length > 0
    ) {
      // Load and merge with existing results
      this.raceSession = this.pilots.map((p) => {
        const pid = typeof p === "object" ? p.id : p;
        const existing = this.race.raceSession.find((r) => {
          const rId = typeof r.pilotId === "object" ? r.pilotId.id : r.pilotId;
          return String(rId) === String(pid);
        });

        if (existing) {
          return {
            pilotId: pid,
            laps: existing.laps !== undefined ? existing.laps : 0,
            bestLapIndex:
              existing.bestLapIndex !== undefined ? existing.bestLapIndex : 0,
            bestLapTime:
              existing.bestLapTime !== undefined ? existing.bestLapTime : 0,
            lapTimes: existing.lapTimes || [],
            finalZone:
              existing.finalZone !== undefined ? existing.finalZone : 0,
          };
        } else {
          return {
            pilotId: pid,
            laps: 0,
            bestLapIndex: 0,
            bestLapTime: 0,
            lapTimes: [],
            finalZone: 0,
          };
        }
      });

      // Check if there is progress
      const hasProgress = this.raceSession.some(
        (r) =>
          r.laps > 0 ||
          (r.lapTimes && r.lapTimes.length > 0) ||
          r.finalZone > 0,
      );
      if (hasProgress) {
        this._state = "finished";
        this._currentSessionIndex = this._totalSessions;
      }
    } else {
      // Prepare clean in-memory telemetry results
      this.raceSession = this.pilots.map((p) => {
        const pid = typeof p === "object" ? p.id : p;
        return {
          pilotId: pid,
          laps: 0,
          bestLapIndex: 0,
          bestLapTime: 0,
          lapTimes: [],
          finalZone: 0,
        };
      });
    }

    this.resetSessionTelemetryFlags();
    this.updateTimerDisplay();

    if (this._state === "finished") {
      this.updateHeaderState("finished");
    } else {
      this.updateHeaderState("idle");
    }

    if (renderFlag) {
      this.updateChildComponents();
    }
  }

  resetSessionTelemetryFlags() {
    this._sessionFirstLapMarked = {};
    this._sessionLapStartTime = {};
    this._sessionLaps = {};
    for (let l = 1; l <= this._lanesCount; l++) {
      const pid = this._laneAssignments[l];
      if (pid) {
        const record = this.raceSession.find(
          (r) => String(r.pilotId) === String(pid),
        );
        const hasLapsInRace =
          record && record.lapTimes && record.lapTimes.length > 0;
        const hasCompletedHeats =
          this._completedLanes[pid] && this._completedLanes[pid].length > 0;
        const hasAccumulatedTime =
          (this._pilotAccumulatedLapTime[pid] || 0) > 0;

        const alreadyStartedTiming = hasLapsInRace || hasCompletedHeats || hasAccumulatedTime;

        this._sessionFirstLapMarked[pid] = alreadyStartedTiming;
        this._sessionLapStartTime[pid] = null;
        this._sessionLaps[pid] = 0;
      }
    }
  }

  initializeHeatStartTimes(startTime) {
    for (let l = 1; l <= this._lanesCount; l++) {
      const pid = this._laneAssignments[l];
      if (pid) {
        const record = this.raceSession.find(
          (r) => String(r.pilotId) === String(pid),
        );
        const hasLapsInRace =
          record && record.lapTimes && record.lapTimes.length > 0;
        const hasCompletedHeats =
          this._completedLanes[pid] && this._completedLanes[pid].length > 0;
        const hasAccumulatedTime =
          (this._pilotAccumulatedLapTime[pid] || 0) > 0;

        const alreadyStartedTiming = hasLapsInRace || hasCompletedHeats || hasAccumulatedTime;

        if (alreadyStartedTiming) {
          this._sessionFirstLapMarked[pid] = true;
          const accTime = this._pilotAccumulatedLapTime[pid] || 0;
          this._sessionLapStartTime[pid] = startTime - accTime * 1000;
        } else {
          this._sessionFirstLapMarked[pid] = false;
          this._sessionLapStartTime[pid] = null;
        }
      }
    }
  }

  updateTimerDisplay() {
    const timer = this.querySelector("slotrace-timer");
    if (timer) {
      timer.reset();
      timer.seconds = this._timePerLane;
      timer.updateDisplay();
    }
  }

  startSession() {
    if (this._state !== "idle") return;

    this._state = "running";
    this.resetSessionTelemetryFlags();
    this.initializeHeatStartTimes(performance.now());

    const timer = this.querySelector("slotrace-timer");
    if (timer) {
      timer.setColor("#adff2f"); // Green timer
      timer.startCountdown(this._timePerLane, () => this.handleSessionTimeUp());
    }

    this.updateHeaderState("running");
    this.updateChildComponents();
  }

  pauseSession() {
    if (this._state !== "running" && this._state !== "interval") return;

    this._pausedState = this._state;
    this._state = "paused";
    this._pauseTimeStart = performance.now();

    const timer = this.querySelector("slotrace-timer");
    if (timer) timer.pause();

    this.updateHeaderState("paused");
    this.updateChildComponents();

    this.saveRaceSessionData();
  }

  resumeSession() {
    if (this._state !== "paused") return;

    this._state = this._pausedState || "running";
    this._pausedState = null;

    // Adjust lap timers to filter out pause duration
    if (this._pauseTimeStart) {
      const pausedDuration = performance.now() - this._pauseTimeStart;
      for (let pid in this._sessionLapStartTime) {
        if (this._sessionLapStartTime[pid]) {
          this._sessionLapStartTime[pid] += pausedDuration;
        }
      }
    }
    this._pauseTimeStart = null;

    const timer = this.querySelector("slotrace-timer");
    if (timer) {
      timer._mode = "down";
      if (this._state === "running") {
        timer.setColor("#adff2f");
        timer._onFinish = () => this.handleSessionTimeUp();
      } else {
        timer.setColor("#ffc107");
        timer._onFinish = () => this.startNextSession();
      }
      timer.resume();
    }

    this.updateHeaderState(this._state);
    this.updateChildComponents();
  }

  triggerLapForLane(laneNum) {
    if (this._state !== "running") return;
    const pilotId = this._laneAssignments[laneNum];
    if (!pilotId) return;

    const now = performance.now();

    // First lap trigger only starts telemetry timing for this heat
    if (!this._sessionFirstLapMarked[pilotId]) {
      this._sessionFirstLapMarked[pilotId] = true;
      this._sessionLapStartTime[pilotId] = now;
      this.updateChildComponents();
      return;
    }

    const lapTime = (now - this._sessionLapStartTime[pilotId]) / 1000;
    this._sessionLapStartTime[pilotId] = now;

    if (this._lapBeepEnabled && window.speechService && typeof window.speechService.playLapBeep === "function") {
      window.speechService.playLapBeep(this._lapBeepDuration, this._lapBeepFrequency);
    }

    // Record lap in current session laps
    if (this._sessionLaps[pilotId] === undefined) {
      this._sessionLaps[pilotId] = 0;
    }
    this._sessionLaps[pilotId]++;

    const record = this.raceSession.find(
      (r) => String(r.pilotId) === String(pilotId),
    );
    if (record) {
      const parsedLapTime = parseFloat(lapTime.toFixed(4));
      const isNewBest = record.bestLapTime === 0 || parsedLapTime < record.bestLapTime;

      record.lapTimes.push({ time: parsedLapTime, lane: laneNum });
      record.laps = record.lapTimes.length;

      // Calculate standings position at this lap
      const sorted = [...this.raceSession].sort((a, b) => {
        const lapsA = a.lapTimes ? a.lapTimes.length : 0;
        const lapsB = b.lapTimes ? b.lapTimes.length : 0;
        if (lapsA !== lapsB) return lapsB - lapsA;
        
        const zoneA = parseFloat(a.finalZone) || 0;
        const zoneB = parseFloat(b.finalZone) || 0;
        if (zoneA !== zoneB) return zoneB - zoneA;
        
        const idxA = this.raceSession.indexOf(a);
        const idxB = this.raceSession.indexOf(b);
        return idxA - idxB;
      });
      const currentPos = sorted.findIndex((r) => String(r.pilotId) === String(pilotId)) + 1;
      if (currentPos > 0) {
        record.lapTimes[record.lapTimes.length - 1].position = currentPos;
      }

      // Calculate best lap
      let minVal = 0;
      let minIdx = 0;
      record.lapTimes.forEach((t, index) => {
        const val = parseFloat((t && typeof t === "object") ? t.time : t) || 0;
        if (val > 0 && (minVal === 0 || val < minVal)) {
          minVal = val;
          minIdx = index + 1;
        }
      });
      record.bestLapTime = minVal;
      record.bestLapIndex = minIdx;

      if (isNewBest) {
        record.bestLapLane = laneNum;
      }
    }

    this.updateChildComponents();
  }

  _playEndBeepIfNeeded() {
    if (this._endBeepEnabled && window.speechService && typeof window.speechService.playEndBeep === "function") {
      window.speechService.playEndBeep(this._endBeepDuration, this._endBeepFrequency);
    }
  }

  // Handle battery time expiration
  async handleSessionTimeUp() {
    this._playEndBeepIfNeeded();
    this._state = "paused";
    this.updateHeaderState("paused");

    const now = performance.now();
    for (let laneNum = 1; laneNum <= this._lanesCount; laneNum++) {
      const pilotId = this._laneAssignments[laneNum];
      if (pilotId) {
        if (
          this._sessionFirstLapMarked[pilotId] &&
          this._sessionLapStartTime[pilotId]
        ) {
          this._pilotAccumulatedLapTime[pilotId] =
            (now - this._sessionLapStartTime[pilotId]) / 1000;
        } else {
          this._pilotAccumulatedLapTime[pilotId] = 0;
        }
      }
    }

    // Add current fenda to completed list for active pilots
    for (let laneNum = 1; laneNum <= this._lanesCount; laneNum++) {
      const pilotId = this._laneAssignments[laneNum];
      if (pilotId) {
        if (!this._completedLanes[pilotId]) this._completedLanes[pilotId] = [];
        if (!this._completedLanes[pilotId].includes(laneNum)) {
          this._completedLanes[pilotId].push(laneNum);
        }
      }
    }

    // Determine exit lane programmatically
    let exitLane = null;
    for (let i = 1; i <= this._lanesCount; i++) {
      if (this._laneRotation[i - 1] === 1) {
        exitLane = i;
        break;
      }
    }
    if (!exitLane) exitLane = this._lanesCount;

    const P = this.pilots.length;
    const L = this._lanesCount;

    // Check if there is an exiting pilot to process
    if (P > L) {
      const exitingPilotId = this._laneAssignments[exitLane];
      if (exitingPilotId) {
        const hasFinishedRace =
          this._completedLanes[exitingPilotId].length >= L;
        const driverObj = this.drivers.find(
          (d) => String(d.id) === String(exitingPilotId),
        );
        const pilotName = driverObj
          ? driverObj.nickname || driverObj.name
          : exitingPilotId;
        const zoneModal = this.querySelector(
          "slotrace-realtime-race-zones-modal",
        );

        if (zoneModal) {
          setTimeout(() => {
            if (hasFinishedRace) {
              // Exiting pilot has finished all lanes of the track
              zoneModal.showFinalZoneModal({
                pilotName,
                laneName: `Fenda ${exitLane}`,
                callback: (zone) => {
                  const record = this.raceSession.find(
                    (r) => String(r.pilotId) === String(exitingPilotId),
                  );
                  if (record) record.finalZone = zone;

                  // Do not return to DECK, they finished the race!
                  this._laneAssignments[exitLane] = null;
                  this.proceedRotation(exitLane);
                },
              });
            } else {
              // Exiting pilot needs to mark stopped zone and return to DECK
              zoneModal.showStoppedZoneModal({
                pilotName,
                laneName: `Fenda ${exitLane}`,
                callback: (zone) => {
                  // Save stopped zone internally to show in DECK list
                  this._pilotStoppedZones[exitingPilotId] = zone;

                  // Push to back of DECK queue
                  this._deckQueue.push(exitingPilotId);
                  this._laneAssignments[exitLane] = null;
                  this.proceedRotation(exitLane);
                },
              });
            }
          }, 1000);
          return;
        }
      }
    }

    this.proceedRotation(exitLane);
  }

  proceedRotation(exitLane) {
    const P = this.pilots.length;
    const L = this._lanesCount;

    const nextAssignments = {};

    if (P > L) {
      // Shift next pilot from DECK queue to Lane 1
      const enteringPilotId = this._deckQueue.shift() || null;
      nextAssignments[1] = enteringPilotId;

      // Rotate all other lanes
      for (let laneNum = 1; laneNum <= L; laneNum++) {
        if (laneNum === exitLane) continue;
        const pilotId = this._laneAssignments[laneNum];
        if (pilotId) {
          const nextLane = this._laneRotation[laneNum - 1];
          nextAssignments[nextLane] = pilotId;
        }
      }
    } else {
      // Rotation without DECK
      for (let laneNum = 1; laneNum <= L; laneNum++) {
        const pilotId = this._laneAssignments[laneNum];
        if (pilotId) {
          const nextLane = this._laneRotation[laneNum - 1];
          nextAssignments[nextLane] = pilotId;
        }
      }
    }

    this._laneAssignments = nextAssignments;
    this.resetSessionTelemetryFlags();

    this._currentSessionIndex++;

    if (this._currentSessionIndex <= this._totalSessions) {
      // Move to Interval state
      if (this._interval > 0) {
        this._state = "interval";
        this.updateHeaderState("interval");
        this.updateChildComponents();
        this.saveRaceSessionData();

        const timer = this.querySelector("slotrace-timer");
        if (timer) {
          timer.setColor("#ffc107"); // Yellow countdown timer
          timer.startCountdown(this._interval, () => this.startNextSession());
        }
      } else {
        this.startNextSession();
      }
    } else {
      // End of Race! Ask final zones for remaining track pilots
      this.promptFinalZonesAndFinish();
    }
  }

  startNextSession() {
    this._state = "running";
    this.updateHeaderState("running");
    this.initializeHeatStartTimes(performance.now());
    this.updateChildComponents();

    const timer = this.querySelector("slotrace-timer");
    if (timer) {
      timer.setColor("#adff2f"); // Green timer
      timer.startCountdown(this._timePerLane, () => this.handleSessionTimeUp());
    }
  }

  promptFinalZonesAndFinish() {
    const finalTrackPilots = [];
    for (let laneNum = 1; laneNum <= this._lanesCount; laneNum++) {
      const pilotId = this._laneAssignments[laneNum];
      if (pilotId) {
        const driverObj = this.drivers.find(
          (d) => String(d.id) === String(pilotId),
        );
        const racePilotObj = this.pilots.find(
          (p) => String(typeof p === "object" ? p.id : p) === String(pilotId),
        );
        const carId =
          racePilotObj && typeof racePilotObj === "object"
            ? racePilotObj.carId
            : null;
        const carObj =
          carId && this.cars
            ? this.cars.find((c) => String(c.id) === String(carId))
            : null;

        finalTrackPilots.push({
          pilotId,
          name: driverObj ? driverObj.nickname || driverObj.name : pilotId,
          photo: driverObj ? driverObj.photo : "",
          carName: carObj ? carObj.name : "",
          laneName: `Fenda ${laneNum}`,
          laneColor: this._laneColors[laneNum - 1] || "#ffffff",
        });
      }
    }

    const zoneModal = this.querySelector("slotrace-realtime-race-zones-modal");
    if (zoneModal && finalTrackPilots.length > 0) {
      zoneModal.showFinalSessionZonesModal({
        activePilots: finalTrackPilots,
        callback: (zones) => {
          for (let pid in zones) {
            const record = this.raceSession.find(
              (r) => String(r.pilotId) === String(pid),
            );
            if (record) {
              record.finalZone = zones[pid];
            }
          }
          this.finishRace();
        },
      });
    } else {
      this.finishRace();
    }
  }

  finishRace() {
    this._state = "finished";
    this.updateHeaderState("finished");
    this.updateChildComponents();

    const timer = this.querySelector("slotrace-timer");
    if (timer) timer.reset();

    this.saveRaceSessionData();
  }

  updateHeaderState(state) {
    const header = this.querySelector("slotrace-realtime-race-header");
    if (header) {
      header.setState(state);
    }
  }

  updateChildComponents() {
    // 1. Update Bateria info header
    const infoTitleEl = this.querySelector("#race-session-info-title");
    if (infoTitleEl) {
      if (this._state === "finished") {
        infoTitleEl.textContent = "CORRIDA CONCLUÍDA";
      } else {
        infoTitleEl.textContent = `BATERIA ${this._currentSessionIndex} DE ${this._totalSessions}`;
      }
    }

    const infoBadgeEl = this.querySelector("#race-session-info-badge");
    if (infoBadgeEl) {
      let badgeHtml = "";
      if (this._state === "idle") {
        badgeHtml = `<span class="badge bg-secondary text-light px-3 py-1.5 fw-bold rounded-pill text-uppercase">Aguardando</span>`;
      } else if (this._state === "running") {
        badgeHtml = `<span class="badge bg-success text-light px-3 py-1.5 fw-bold rounded-pill text-uppercase">Correndo</span>`;
      } else if (this._state === "paused") {
        badgeHtml = `<span class="badge bg-danger text-light px-3 py-1.5 fw-bold rounded-pill text-uppercase">Pausada</span>`;
      } else if (this._state === "interval") {
        badgeHtml = `<span class="badge bg-warning text-dark px-3 py-1.5 fw-bold rounded-pill text-uppercase">Intervalo</span>`;
      } else if (this._state === "finished") {
        badgeHtml = `<span class="badge bg-primary text-light px-3 py-1.5 fw-bold rounded-pill text-uppercase">Finalizada</span>`;
      }
      infoBadgeEl.innerHTML = badgeHtml;
    }

    // 2. Update Session component
    const session = this.querySelector("slotrace-realtime-race-session");
    if (session) {
      session.setData({
        laneAssignments: this._laneAssignments,
        laneColors: this._laneColors,
        sessionFirstLapMarked: this._sessionFirstLapMarked,
        sessionLaps: this._sessionLaps,
        raceSession: this.raceSession,
        pilots: this.pilots,
        drivers: this.drivers,
        cars: this.cars,
        lanesCount: this._lanesCount,
        state: this._state,
        pilotAccumulatedLapTime: this._pilotAccumulatedLapTime,
        sessionLapStartTime: this._sessionLapStartTime,
        pauseTimeStart: this._pauseTimeStart,
      });
    }

    // 3. Update Standings component
    const standingsComp = this.querySelector(
      "#race-session-standings-component",
    );
    if (standingsComp) {
      standingsComp.setData({
        raceSession: this.raceSession,
        pilots: this.pilots,
        drivers: this.drivers,
        cars: this.cars,
      });
    }

    // 4. Update Queue component
    const queueComp = this.querySelector("#race-session-queue-component");
    if (queueComp) {
      queueComp.setData({
        deckQueue: this._deckQueue,
        drivers: this.drivers,
        pilotStoppedZones: this._pilotStoppedZones,
        laneColors: this._laneColors,
      });
    }
  }

  async loadDataAndRender(canResumeInMemory = false) {
    let tracks = [];
    try {
      this.drivers = (await window.electronAPI.db.get("drivers")) || [];
      this.cars = (await window.electronAPI.db.get("cars")) || [];
      tracks = (await window.electronAPI.db.get("tracks")) || [];
      const settings = (await window.electronAPI.db.get("settings")) || {};
      this._lapBeepEnabled = settings.lap_beep !== false;
      this._endBeepEnabled = settings.end_beep !== false;
      this._lapBeepDuration = settings.lap_beep_duration !== undefined ? parseFloat(settings.lap_beep_duration) : 0.50;
      this._endBeepDuration = settings.end_beep_duration !== undefined ? parseFloat(settings.end_beep_duration) : 0.5;
      this._lapBeepFrequency = settings.lap_beep_frequency !== undefined ? parseInt(settings.lap_beep_frequency, 10) : 1300;
      this._endBeepFrequency = settings.end_beep_frequency !== undefined ? parseInt(settings.end_beep_frequency, 10) : 500;
    } catch (e) {
      this.drivers = [];
      this.cars = [];
      tracks = [];
      this._lapBeepEnabled = true;
      this._endBeepEnabled = true;
      this._lapBeepDuration = 0.50;
      this._endBeepDuration = 0.5;
      this._lapBeepFrequency = 1300;
      this._endBeepFrequency = 500;
    }

    if (!this.querySelector("#modal-realtime-race")) {
      this.render();
    }
    this.showModal();

    this.tracks = tracks;

    // Initialize properties from active race
    this._timePerLane = this.race?.timePerLane || 60;
    this._interval =
      this.race?.interval !== undefined ? this.race.interval : 10;

    const track = this.tracks
      ? this.tracks.find((t) => String(t.id) === String(this.race?.trackId))
      : null;
    this._lanesCount = track ? parseInt(track.lanes) || 4 : 4;

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
    this._laneColors =
      track?.laneColors || defaultColors.slice(0, this._lanesCount);
    this._laneRotation =
      track?.laneRotation ||
      Array.from(
        { length: this._lanesCount },
        (_, i) => ((i + 1) % this._lanesCount) + 1,
      );

    this.pilots = this.race?.pilots || [];
    this._totalSessions = Math.max(this.pilots.length, this._lanesCount);

    if (canResumeInMemory) {
      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.setColor("#ffc107"); // Yellow color for paused state
        timer.updateDisplay();
      }
      this.updateHeaderState("paused");
      this.updateChildComponents();
    } else if (this.race && this.race.activeSessionState) {
      // Restore from persistent activeSessionState
      const stateObj = this.race.activeSessionState;
      this._state = stateObj.state || "paused";
      this._pausedState = stateObj.pausedState || "running";
      this._currentSessionIndex = stateObj.currentSessionIndex || 1;
      this._laneAssignments = stateObj.laneAssignments || {};
      this._deckQueue = stateObj.deckQueue || [];
      this._completedLanes = stateObj.completedLanes || {};
      this._pilotStoppedZones = stateObj.pilotStoppedZones || {};
      this._pilotAccumulatedLapTime = stateObj.pilotAccumulatedLapTime || {};
      this._sessionLaps = stateObj.sessionLaps || {};
      this._sessionFirstLapMarked = stateObj.sessionFirstLapMarked || {};

      this._pauseTimeStart = performance.now();
      const currentLapElapsed = stateObj.pilotCurrentLapElapsed || {};

      this._sessionLapStartTime = {};
      for (let pid in this._sessionFirstLapMarked) {
        if (this._sessionFirstLapMarked[pid]) {
          const elapsed = currentLapElapsed[pid] || 0;
          this._sessionLapStartTime[pid] =
            this._pauseTimeStart - elapsed * 1000;
        } else {
          this._sessionLapStartTime[pid] = null;
        }
      }

      this.raceSession = this.race.raceSession || [];

      const timer = this.querySelector("slotrace-timer");
      if (timer) {
        timer.setColor("#ffc107");
        timer.seconds =
          stateObj.remainingSeconds !== undefined
            ? stateObj.remainingSeconds
            : this._timePerLane;
        timer.updateDisplay();
      }
      this.updateHeaderState("paused");
      this.updateChildComponents();
    } else {
      // Reset session, preserving existing progress
      this.resetSession(true, true);
    }

    const header = this.querySelector("slotrace-realtime-race-header");
    if (header && this.race) {
      header.setData({ race: this.race });
      header.setState(this._state);
    }

    // Populate configurations modal data
    const configModal = this.querySelector(
      "slotrace-realtime-race-config-modal",
    );
    if (configModal && this.race) {
      configModal.setData({
        timePerLane: this._timePerLane,
        interval: this._interval,
      });
    }
  }

  getPilotCurrentLapElapsed(pid, now) {
    if (
      !this._sessionFirstLapMarked ||
      !this._sessionFirstLapMarked[pid] ||
      !this._sessionLapStartTime[pid]
    ) {
      return 0;
    }
    const baseTime =
      this._state === "paused" && this._pauseTimeStart
        ? this._pauseTimeStart
        : now;
    return Math.max(0, (baseTime - this._sessionLapStartTime[pid]) / 1000);
  }

  async saveRaceSessionData() {
    if (!this.race) return;
    this.race.raceSession = this.raceSession;

    // Serialize active session state if in progress
    if (
      this._state === "paused" ||
      this._state === "running" ||
      this._state === "interval"
    ) {
      const timer = this.querySelector("slotrace-timer");
      const remainingSeconds = timer ? timer.seconds : this._timePerLane;

      const pilotCurrentLapElapsed = {};
      const now = performance.now();
      for (let l = 1; l <= this._lanesCount; l++) {
        const pid = this._laneAssignments[l];
        if (pid) {
          pilotCurrentLapElapsed[pid] = this.getPilotCurrentLapElapsed(
            pid,
            now,
          );
        }
      }

      this.race.activeSessionState = {
        state: "paused", // Always restore in paused state
        pausedState: this._pausedState || this._state,
        currentSessionIndex: this._currentSessionIndex,
        laneAssignments: this._laneAssignments,
        deckQueue: this._deckQueue,
        completedLanes: this._completedLanes,
        pilotStoppedZones: this._pilotStoppedZones,
        pilotAccumulatedLapTime: this._pilotAccumulatedLapTime,
        sessionLaps: this._sessionLaps,
        sessionFirstLapMarked: this._sessionFirstLapMarked,
        remainingSeconds: remainingSeconds,
        pilotCurrentLapElapsed: pilotCurrentLapElapsed,
      };
    } else {
      this.race.activeSessionState = null;
    }

    try {
      const races = (await window.electronAPI.db.get("races")) || [];
      const idx = races.findIndex((r) => r.id === this.race.id);
      if (idx !== -1) {
        races[idx].raceSession = this.raceSession;
        races[idx].activeSessionState = this.race.activeSessionState;
        await window.electronAPI.db.set("races", races);
        console.log(
          `[Database] Auto-saved race results and active state for ID: ${this.race.id}`,
        );
      }
    } catch (err) {
      console.error("Failed to auto-save race results:", err);
    }
    window.dispatchEvent(new CustomEvent("raceListChanged"));
  }

  showModal() {
    const modalEl = this.querySelector("#modal-realtime-race");
    if (modalEl) {
      let modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalEl);
      }

      modalEl.addEventListener("hidden.bs.modal", () => {
        if (this._state === "running" || this._state === "interval") {
          this._pausedState = this._state;
          this._state = "paused";
        }
        this.saveRaceSessionData();

        const timer = this.querySelector("slotrace-timer");
        if (timer) {
          timer.pause();
        }
        const header = this.querySelector("slotrace-realtime-race-header");
        if (header) {
          header.setState("idle");
        }
      });

      modalInstance.show();
    }
  }

  render() {
    if (!this.race) {
      this.innerHTML = "";
      return;
    }

    this.innerHTML = `
      <div class="modal fade" id="modal-realtime-race" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content border-0 text-white d-flex flex-column h-100">
            
            <!-- Header section -->
            <slotrace-realtime-race-header></slotrace-realtime-race-header>
            
            <!-- Content area: 2 columns -->
            <div class="modal-body d-flex flex-grow-1 p-0">

              <!-- SESSION -->
              <div class="d-flex flex-column flex-grow-1" style="width: 65%; min-height: 0;">
                <slotrace-realtime-race-session class="h-100"></slotrace-realtime-race-session>
                <!-- DECK queue section -->
                <slotrace-realtime-race-queue id="race-session-queue-component"></slotrace-realtime-race-queue>
              </div>

              <!-- STANDINGS -->
              <div class="d-flex flex-column overflow-y-auto border-start border-secondary-subtle flex-shrink-0" style="width: 35%; min-width: 380px; min-height: 0; !important;">
                <!-- Standings Table section -->
                <slotrace-realtime-race-standings id="race-session-standings-component" class="flex-grow-1" style="min-height: 0; display: flex; flex-direction: column;"></slotrace-realtime-race-standings>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Race Config Mini Modal Component -->
      <slotrace-realtime-race-config-modal></slotrace-realtime-race-config-modal>

      <!-- Race Zones Modals Component -->
      <slotrace-realtime-race-zones-modal></slotrace-realtime-race-zones-modal>


    `;
  }
}

customElements.define("slotrace-realtime-race", SlotRaceRealtimeRace);
