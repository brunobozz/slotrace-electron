function getLaneColor(lane) {
  const colors = {
    1: "#ff3b30", // Red
    2: "#007aff", // Blue
    3: "#34c759", // Green
    4: "#ffcc00", // Yellow
    5: "#ff9500", // Orange
    6: "#ffffff", // White
    7: "#af52de", // Purple
    8: "#8e8e93", // Grey
  };
  return colors[lane] || "#8e8e93";
}

class QualiQueue extends HTMLElement {
  connectedCallback() {
    this.pendingPilots = [];
    this.drivers = [];
    this.startIndex = 1;
    this.lane = 1;
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

  setData({ pendingPilots, drivers, startIndex, lane, laneColors }) {
    this.pendingPilots = pendingPilots || [];
    this.drivers = drivers || [];
    this.startIndex = startIndex || 1;
    this.lane = lane || 1;
    this.laneColors = laneColors || null;
    this.render();
  }

  _resolveName(pilotId) {
    const driver = this.drivers.find((d) => d.id === pilotId);
    if (!driver) return pilotId;
    const baseName = driver.name || driver.nickname || pilotId;
    return baseName.trim().split(/\s+/)[0];
  }

  render() {
    const title = window.t("realtime_quali.queue.title") || "NEXT";
    const defaultColors = {
      1: "#ff3b30", // Red
      2: "#007aff", // Blue
      3: "#34c759", // Green
      4: "#ffcc00", // Yellow
      5: "#ff9500", // Orange
      6: "#ffffff", // White
      7: "#af52de", // Purple
      8: "#8e8e93", // Grey
    };
    const laneColor =
      (this.laneColors && this.laneColors[this.lane - 1]) ||
      defaultColors[this.lane] ||
      "#8e8e93";

    const rowsHtml = this.pendingPilots
      .map((pilot, index) => {
        const seqNum = this.startIndex + index;
        const name = this._resolveName(pilot.id);

        return `
        <tr>
          <td class="align-middle fw-bold fs-4 ps-3 text-body-secondary">
            ${name}
          </td>
          <td class="align-middle text-center" style="width: 30%;">
            <div class="d-flex align-items-center justify-content-end pe-3">
              <span style="display: inline-block; width: 28px; height: 28px; border-radius: 50%; background-color: ${laneColor}; box-shadow: 0 0 8px ${laneColor}; border: 1.5px solid rgba(255,255,255,0.30);"></span>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");

    this.innerHTML = `
      <div class="d-flex flex-column h-100">
        <!-- Title -->
        <div class="border-bottom border-top border-secondary-subtle p-2">
          <div class="text-uppercase text-body-secondary text-center fw-bold" style="letter-spacing: 0.1rem;">
            ${title}
          </div>
        </div>

        <!-- Table Body (Scrollable) -->
        <div class="flex-grow-1 overflow-y-auto" style="min-height: 0;">
          <table class="table mb-0" style="table-layout: fixed; width: 100%;">
            <tbody>
              ${rowsHtml || `<tr><td colspan="" class="py-3 text-start" style="font-size: 1.1rem; width: 100%;">—</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

customElements.define("quali-queue", QualiQueue);
