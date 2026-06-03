class QualiQueue extends HTMLElement {
  connectedCallback() {
    this.pendingPilots = [];
    this.drivers = [];
    this.startIndex = 1;
    this.innerHTML = '';
  }

  setData({ pendingPilots, drivers, startIndex }) {
    this.pendingPilots = pendingPilots || [];
    this.drivers = drivers || [];
    this.startIndex = startIndex || 1;
    this.render();
  }

  _resolveName(pilotId) {
    const driver = this.drivers.find(d => d.id === pilotId);
    if (!driver) return pilotId;
    return driver.nickname || driver.name || pilotId;
  }

  render() {
    const title = window.t('realtime_quali.queue.title') || 'NEXT';

    const rowsHtml = this.pendingPilots.map((pilot, index) => {
      const seqNum = this.startIndex + index;
      const name = this._resolveName(pilot.id);

      return `
        <tr>
          <td class="align-middle text-center" style="width: 12%; font-weight: 600; color: #8b949e; font-size: 1.3rem;">
            ${seqNum}
          </td>
          <td class="align-middle text-center text-uppercase" style="width: 58%; font-size: 1.25rem; font-weight: 600; color: #c9d1d9; letter-spacing: 0.03em;">
            ${name}
          </td>
          <td class="align-middle text-center" style="width: 30%; font-size: 1.2rem; font-weight: 600; color: #ff8c00;">
            LANE
          </td>
        </tr>
      `;
    }).join('');

    this.innerHTML = `
      <style>
        quali-queue table {
          background-color: #1a1d23;
          margin-bottom: 0;
        }
        quali-queue .quali-queue-header {
          background-color: #2b3038;
          color: #c9d1d9;
        }
        quali-queue tbody tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        quali-queue tbody tr:last-child {
          border-bottom: none;
        }
      </style>

      <div class="border border-secondary-subtle rounded-3 overflow-hidden shadow-sm" style="background-color: #1a1d23;">
        <table class="table table-dark table-borderless align-middle mb-0 text-center" style="background-color: #1a1d23;">
          <thead>
            <tr class="quali-queue-header">
              <th colspan="3" class="text-center text-uppercase fw-bold py-3" style="font-size: 1.2rem; letter-spacing: 0.15em;">
                ${title}
              </th>
            </tr>
            <tr style="background-color: #14171d; font-size: 0.95rem; letter-spacing: 0.08em; color: #8b949e;">
              <th class="text-center py-2 fw-semibold" style="width: 12%;">#</th>
              <th class="text-center py-2 fw-semibold" style="width: 58%;">Pilot</th>
              <th class="text-center py-2 fw-semibold" style="width: 30%;">Lane</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="3" class="text-secondary py-3" style="font-size: 1.1rem;">—</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }
}

customElements.define('quali-queue', QualiQueue);
