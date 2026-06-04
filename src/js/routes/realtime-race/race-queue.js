class SlotRaceRealtimeRaceQueue extends HTMLElement {
  connectedCallback() {
    this.deckQueue = [];
    this.drivers = [];
    this.pilotStoppedZones = {};
    this.render();
  }

  setData({ deckQueue, drivers, pilotStoppedZones }) {
    this.deckQueue = deckQueue || [];
    this.drivers = drivers || [];
    this.pilotStoppedZones = pilotStoppedZones || {};
    this.render();
  }

  render() {
    let deckQueueHtml = "";
    if (this.deckQueue.length > 0) {
      deckQueueHtml = this.deckQueue
        .map((pid, idx) => {
          const driverObj = this.drivers.find(d => String(d.id) === String(pid));
          const name = driverObj ? (driverObj.nickname || driverObj.name) : pid;
          const photoUrl = driverObj ? driverObj.photo : "";
          const zoneVal = this.pilotStoppedZones && this.pilotStoppedZones[pid] !== undefined ? this.pilotStoppedZones[pid] : null;
          const pos = idx + 1;

          return `
            <div class="d-flex align-items-center justify-content-between p-2 rounded bg-body-tertiary border border-secondary-subtle">
              <div class="d-flex align-items-center gap-2">
                <span class="fw-bold text-secondary me-1" style="font-size: 1.1rem; width: 20px;">#${pos}</span>
                <div class="rounded-circle overflow-hidden bg-body-secondary border border-secondary-subtle" style="width: 32px; height: 32px;">
                  ${photoUrl ? `<img src="${photoUrl}" class="w-100 h-100 object-fit-cover">` : `<div class="w-100 h-100 d-flex align-items-center justify-content-center bg-body-tertiary"><i class="mdi mdi-account text-secondary" style="font-size: 0.8rem;"></i></div>`}
                </div>
                <span class="fw-bold text-body-emphasis small text-truncate" style="max-width: 130px;">${name}</span>
              </div>
              ${zoneVal !== null ? `<span class="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle rounded px-2 py-1 fw-bold" style="font-size: 0.75rem;">Volta na Zona ${zoneVal}</span>` : `<span class="text-secondary small fw-medium">Fila</span>`}
            </div>
          `;
        })
        .join("");
    } else {
      deckQueueHtml = `<div class="text-center py-3 text-secondary border border-dashed rounded border-secondary-subtle small fw-medium">Nenhum piloto no deck de espera.</div>`;
    }

    this.innerHTML = `
      <div class="mt-auto" style="min-height: 140px; display: flex; flex-direction: column;">
        <h6 class="fw-bold text-body-emphasis mb-2 d-flex align-items-center gap-1.5 uppercase small tracking-wider" style="font-size: 0.78rem;">
          <i class="mdi mdi-ray-start-arrow text-warning fs-5"></i>
          DECK (PRÓXIMOS DE ENTRAR)
        </h6>
        <div class="d-flex flex-column gap-2 overflow-y-auto flex-grow-1 pr-1" style="max-height: 160px; min-height: 80px;">
          ${deckQueueHtml}
        </div>
      </div>
    `;
  }
}

customElements.define("slotrace-realtime-race-queue", SlotRaceRealtimeRaceQueue);
