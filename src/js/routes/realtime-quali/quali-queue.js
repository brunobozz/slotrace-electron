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

class QualiQueue extends HTMLElement {
  connectedCallback() {
    this.pendingPilots = [];
    this.drivers = [];
    this.startIndex = 1;
    this.lane = 1;
    this.innerHTML = '';

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

  setData({ pendingPilots, drivers, startIndex, lane }) {
    this.pendingPilots = pendingPilots || [];
    this.drivers = drivers || [];
    this.startIndex = startIndex || 1;
    this.lane = lane || 1;
    this.render();
  }

  _resolveName(pilotId) {
    const driver = this.drivers.find(d => d.id === pilotId);
    if (!driver) return pilotId;
    return driver.nickname || driver.name || pilotId;
  }

  render() {
    const title = window.t('realtime_quali.queue.title') || 'NEXT';
    const laneColor = getLaneColor(this.lane);

    const rowsHtml = this.pendingPilots.map((pilot, index) => {
      const seqNum = this.startIndex + index;
      const name = this._resolveName(pilot.id);

      return `
        <tr>
          <td class="align-middle text-center" style="width: 12%; font-weight: 600; color: #8b949e; font-size: 1.3rem;">
            ${seqNum}
          </td>
          <td class="align-middle text-center" style="width: 30%;">
            <div class="d-flex align-items-center justify-content-center">
              <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: ${laneColor}; box-shadow: 0 0 8px ${laneColor}; border: 1.5px solid rgba(255,255,255,0.30);"></span>
            </div>
          </td>
          <td class="align-middle text-end text-uppercase" style="width: 58%; font-size: 1.25rem; font-weight: 600; color: #c9d1d9; letter-spacing: 0.03em; padding-right: 2.5rem;">
            ${name}
          </td>
        </tr>
      `;
    }).join('');

    this.innerHTML = `
      <style>
        quali-queue table, 
        quali-queue tr, 
        quali-queue td, 
        quali-queue th {
          background-color: transparent !important;
        }
        quali-queue tbody tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        quali-queue tbody tr:last-child {
          border-bottom: none;
        }
        /* Custom scrollbar style */
        quali-queue .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        quali-queue .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        quali-queue .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }
        quali-queue .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      </style>

      <div class="d-flex flex-column h-100" style="background: transparent;">
        <!-- Title -->
        <div class="d-flex align-items-center" style="padding: 0.6rem 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
          <div style="font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #6c757d;">
            ${title}
          </div>
        </div>

        <!-- Table Header (Fixed) -->
        <table class="table table-dark table-borderless mb-0" style="background: transparent; table-layout: fixed; width: 100%;">
          <thead>
            <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.08); font-size: 0.95rem; letter-spacing: 0.08em; color: #8b949e;">
              <th class="py-2 text-center" style="width: 12%;">#</th>
              <th class="py-2 text-center" style="width: 30%;">${window.t('realtime_quali.queue.lane') || 'Lane'}</th>
              <th class="py-2 text-end" style="width: 58%; padding-right: 2.5rem;">${window.t('realtime_quali.queue.pilot') || 'Driver'}</th>
            </tr>
          </thead>
        </table>

        <!-- Table Body (Scrollable) -->
        <div class="flex-grow-1 overflow-y-auto" style="min-height: 0;">
          <table class="table table-dark table-borderless mb-0" style="background: transparent; table-layout: fixed; width: 100%;">
            <tbody>
              ${rowsHtml || `<tr><td colspan="3" class="text-secondary py-3 text-center" style="font-size: 1.1rem; width: 100%;">—</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

customElements.define('quali-queue', QualiQueue);
