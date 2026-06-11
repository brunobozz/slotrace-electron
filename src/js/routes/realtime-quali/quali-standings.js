class QualiStandings extends HTMLElement {
  connectedCallback() {
    this.quali = [];
    this.drivers = [];
    this.state = "idle";
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

  setData({ quali, drivers, state }) {
    this.quali = quali || [];
    this.drivers = drivers || [];
    this.state = state || "idle";
    this.render();
  }

  _resolveName(pilotId) {
    const driver = this.drivers.find((d) => d.id === pilotId);
    if (!driver) return pilotId;
    const baseName = driver.name || driver.nickname || pilotId;
    return baseName.trim().split(/\s+/)[0];
  }

  render() {
    const title = window.t("realtime_quali.standings.title") || "STANDINGS";

    // Sort: lowest bestLapTime first; zeros go to bottom; among zeros preserve quali array order
    // If times are identical, the tie-breaker is who did it first (earlier bestLapTimeSetAt wins)
    const sorted = [...this.quali].sort((a, b) => {
      const timeA = parseFloat(a.bestLapTime) || 0;
      const timeB = parseFloat(b.bestLapTime) || 0;

      if (timeA === 0 && timeB === 0) {
        const idxA = this.quali.indexOf(a);
        const idxB = this.quali.indexOf(b);
        return idxA - idxB;
      }
      if (timeA === 0) return 1;
      if (timeB === 0) return -1;
      
      if (timeA === timeB) {
        const setAtA = a.bestLapTimeSetAt || 0;
        const setAtB = b.bestLapTimeSetAt || 0;
        if (setAtA !== setAtB) {
          if (setAtA === 0) return 1;
          if (setAtB === 0) return -1;
          return setAtA - setAtB;
        }
        const idxA = this.quali.indexOf(a);
        const idxB = this.quali.indexOf(b);
        return idxA - idxB;
      }
      
      return timeA - timeB;
    });

    const isQualiRunning = this.state === "qualifying" || this.state === "interval";
    const cursorStyle = isQualiRunning ? "" : "cursor: pointer;";
    const hoverStyle = isQualiRunning ? "" : `
      .standings-pilot-row:hover {
        background-color: rgba(255, 255, 255, 0.05) !important;
      }
    `;

    const leaderTime =
      sorted.length > 0 ? parseFloat(sorted[0].bestLapTime) || 0 : 0;

    const rowsHtml = sorted
      .map((item, index) => {
        const pos = index + 1;
        const name = this._resolveName(item.pilotId);
        const bestTime = parseFloat(item.bestLapTime) || 0;

        const bestTimeStr = bestTime > 0 ? bestTime.toFixed(4) : "—";

        let diffStr = "—";
        let diffColor = "";
        if (index > 0 && bestTime > 0 && leaderTime > 0) {
          const diff = bestTime - leaderTime;
          diffStr = `+${diff.toFixed(4)}`;
          diffColor = "color: #c4b700ff !important";
        }

        const isFirst = index === 0 && bestTime > 0;
        const rowClass = isFirst ? "leader-row" : "";

        return `
        <tr class="standings-pilot-row" data-pilot-id="${item.pilotId}" style="${cursorStyle}">
          <td class="align-middle fw-bold fs-4 text-body-secondary ${rowClass}" style="width: 10%;">
            ${pos}
          </td>
          <td class="align-middle text-start fw-bold fs-3 text-body-secondary ${rowClass}" style="width: 30%;">
            ${name}
          </td>
          <td class="align-middle font-monospace text-center fw-bold fs-4 text-body-secondary ${rowClass}" style="width: 30%; ${diffColor}">
            ${diffStr}
          </td>
          <td class="align-middle font-monospace text-center fw-bold fs-2 text-body-secondary ${rowClass}" style="width: 30%;">
            ${bestTimeStr}
          </td>
        </tr>
      `;
      })
      .join("");

    this.innerHTML = `
      <style>
        .leader-row {
          background-color: #aa55ff !important;
          color:#fff !important;
        }
        ${hoverStyle}
      </style>
      <div class="d-flex flex-column h-100">
        <!-- Title -->
        <div class="border-bottom border-secondary-subtle p-2">
          <div class="text-uppercase text-body-secondary text-center fw-bold" style="letter-spacing: 0.1rem;">
            ${title}
          </div>
        </div>

        <!-- Table Body (Scrollable) -->
        <div class="flex-grow-1 overflow-y-auto" style="min-height: 0;">
          <table class="table text-center mb-0" style="table-layout: fixed; width: 100%;">
            <tbody>
              ${rowsHtml || `<tr><td colspan="4" class="text-secondary py-3" style="font-size: 1.1rem; width: 100%;">—</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const isQualiRunning = this.state === "qualifying" || this.state === "interval";
    if (isQualiRunning) return;

    const rows = this.querySelectorAll(".standings-pilot-row");
    rows.forEach(row => {
      row.addEventListener("click", () => {
        const pilotId = row.getAttribute("data-pilot-id");
        window.dispatchEvent(new CustomEvent("requestSelectTelemetryPilot", {
          detail: { pilotId }
        }));
      });
    });
  }
}

customElements.define("quali-standings", QualiStandings);
