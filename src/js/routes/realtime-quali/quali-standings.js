class QualiStandings extends HTMLElement {
  connectedCallback() {
    this.quali = [];
    this.drivers = [];
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

  setData({ quali, drivers }) {
    this.quali = quali || [];
    this.drivers = drivers || [];
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
      return timeA - timeB;
    });

    const leaderTime =
      sorted.length > 0 ? parseFloat(sorted[0].bestLapTime) || 0 : 0;

    const rowsHtml = sorted
      .map((item, index) => {
        const pos = index + 1;
        const name = this._resolveName(item.pilotId);
        const bestTime = parseFloat(item.bestLapTime) || 0;

        const bestTimeStr = bestTime > 0 ? bestTime.toFixed(4) : "—";

        let diffStr = "—";
        let diffColor = "#8b949e";
        if (index > 0 && bestTime > 0 && leaderTime > 0) {
          const diff = bestTime - leaderTime;
          diffStr = `+${diff.toFixed(4)}`;
          diffColor = "#ffcc00"; // Yellow
        }

        const isFirst = index === 0 && bestTime > 0;
        const rowClass = isFirst ? 'class="leader-row"' : "";

        return `
        <tr ${rowClass}>
          <td class="align-middle fw-bold fs-4 text-body-secondary" style="width: 12%;">
            ${pos}
          </td>
          <td class="align-middle text-start fw-bold fs-4 text-body-secondary" style="width: 40%;">
            ${name}
          </td>
          <td class="align-middle text-center" style="width: 24%; font-family: 'Courier New', monospace; font-size: 1.3rem; color: ${diffColor};">
            ${diffStr}
          </td>
          <td class="align-middle text-center" style="width: 24%; font-family: 'Courier New', monospace; font-size: 1.5rem; font-weight: 600;">
            ${bestTimeStr}
          </td>
        </tr>
      `;
      })
      .join("");

    this.innerHTML = `

      <div class="d-flex flex-column h-100">
        <!-- Title -->
        <div class="d-flex align-items-center border-bottom border-secondary-subtle p-2">
          <div class="text-uppercase text-body-secondary fw-bold" style="letter-spacing: 0.1rem;">
            ${title}
          </div>
        </div>

        <!-- Table Header (Fixed) -->
        <table class="table text-center mb-0" style="table-layout: fixed; width: 100%;">
          <thead>
            <tr style="font-size: 0.95rem; letter-spacing: 0.08em;">
              <th class="py-2" style="width: 12%;">${window.t("realtime_quali.standings.position") || "Pos"}</th>
              <th class="py-2 text-start ps-4" style="width: 40%;">${window.t("realtime_quali.standings.pilot") || "Driver"}</th>
              <th class="py-2" style="width: 24%;">${window.t("realtime_quali.standings.diff") || "Diff"}</th>
              <th class="py-2" style="width: 24%;">${window.t("realtime_quali.standings.best") || "Best"}</th>
            </tr>
          </thead>
        </table>

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
  }
}

customElements.define("quali-standings", QualiStandings);
