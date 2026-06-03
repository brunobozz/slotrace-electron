class QualiStandings extends HTMLElement {
  connectedCallback() {
    this.quali = [];
    this.drivers = [];
    this.innerHTML = '';
  }

  setData({ quali, drivers }) {
    this.quali = quali || [];
    this.drivers = drivers || [];
    this.render();
  }

  _resolveName(pilotId) {
    const driver = this.drivers.find(d => d.id === pilotId);
    if (!driver) return pilotId;
    return driver.nickname || driver.name || pilotId;
  }

  render() {
    const title = window.t('realtime_quali.standings.title') || 'STANDINGS';

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

    const leaderTime = sorted.length > 0 ? (parseFloat(sorted[0].bestLapTime) || 0) : 0;

    const rowsHtml = sorted.map((item, index) => {
      const pos = index + 1;
      const name = this._resolveName(item.pilotId);
      const bestTime = parseFloat(item.bestLapTime) || 0;

      const bestTimeStr = bestTime > 0 ? bestTime.toFixed(4) : '—';

      let diffStr = '—';
      if (index > 0 && bestTime > 0 && leaderTime > 0) {
        const diff = bestTime - leaderTime;
        diffStr = `+${diff.toFixed(4)}`;
      }

      const isFirst = index === 0 && bestTime > 0;
      const rowBg = isFirst ? 'background-color: rgba(13, 110, 253, 0.08);' : '';

      return `
        <tr style="${rowBg}">
          <td class="align-middle text-center" style="width: 12%; font-weight: 700; color: #fff; font-size: 1.4rem;">
            ${pos}
          </td>
          <td class="align-middle text-center text-uppercase" style="width: 40%; font-size: 1.25rem; font-weight: 600; color: #c9d1d9; letter-spacing: 0.03em;">
            ${name}
          </td>
          <td class="align-middle text-center" style="width: 24%; font-family: 'Courier New', monospace; font-size: 1.5rem; font-weight: 600; color: #e6e6e6;">
            ${bestTimeStr}
          </td>
          <td class="align-middle text-center" style="width: 24%; font-family: 'Courier New', monospace; font-size: 1.3rem; color: #8b949e;">
            ${diffStr}
          </td>
        </tr>
      `;
    }).join('');

    this.innerHTML = `
      <style>
        quali-standings table {
          background-color: #1a1d23;
          margin-bottom: 0;
        }
        quali-standings .quali-standings-header {
          background-color: #0d6efd;
          color: #fff;
        }
        quali-standings tbody tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        quali-standings tbody tr:last-child {
          border-bottom: none;
        }
      </style>

      <div class="border border-secondary-subtle rounded-3 overflow-hidden shadow-sm" style="background-color: #1a1d23;">
        <table class="table table-dark table-borderless align-middle mb-0 text-center" style="background-color: #1a1d23;">
          <thead>
            <tr class="quali-standings-header">
              <th colspan="4" class="text-center text-uppercase fw-bold py-3" style="font-size: 1.2rem; letter-spacing: 0.15em;">
                ${title}
              </th>
            </tr>
            <tr style="background-color: #14171d; font-size: 0.95rem; letter-spacing: 0.08em; color: #8b949e;">
              <th class="text-center py-2 fw-semibold" style="width: 12%;">Pos</th>
              <th class="text-center py-2 fw-semibold" style="width: 40%;">Pilot</th>
              <th class="text-center py-2 fw-semibold" style="width: 24%;">Best</th>
              <th class="text-center py-2 fw-semibold" style="width: 24%;">Diff</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="4" class="text-secondary py-3" style="font-size: 1.1rem;">—</td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  }
}

customElements.define('quali-standings', QualiStandings);
