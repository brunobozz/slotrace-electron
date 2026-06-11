class SlotRaceRealtimeRaceQueue extends HTMLElement {
  connectedCallback() {
    this.deckQueue = [];
    this.drivers = [];
    this.pilotStoppedZones = {};
    this.laneColors = [];
    this.render();
  }

  setData({ deckQueue, drivers, pilotStoppedZones, laneColors }) {
    this.deckQueue = deckQueue || [];
    this.drivers = drivers || [];
    this.pilotStoppedZones = pilotStoppedZones || {};
    this.laneColors = laneColors || [];
    this.render();
  }

  render() {
    let deckQueueHtml = "";
    const lane1Color = this.laneColors && this.laneColors[0] ? this.laneColors[0] : '#ff3b30';

    if (this.deckQueue.length > 0) {
      deckQueueHtml = this.deckQueue
        .map((pid, idx) => {
          const driverObj = this.drivers.find(
            (d) => String(d.id) === String(pid),
          );
          const name = driverObj ? driverObj.nickname || driverObj.name : pid;
          const photoUrl = driverObj ? driverObj.photo : "";
          const zoneVal =
            this.pilotStoppedZones && this.pilotStoppedZones[pid] !== undefined
              ? this.pilotStoppedZones[pid]
              : null;
          const pos = idx + 1;

          return `
            <style>
              .next-driver:last-child{
                border-right: 0px !important;
              }
            </style>
            <div class="next-driver d-flex flex-grow-1 align-items-center justify-content-center gap-2 p-2 border-end">
              ${pos == 1 ? `<i class="mdi mdi-circle fs-2" style="color: ${lane1Color};"></i>` : ``}
              <!--<div class="rounded-circle overflow-hidden border border-secondary-subtle flex-shrink-0" style="width: 32px; height: 32px;">
                ${photoUrl ? `<img src="${photoUrl}" class="w-100 h-100 object-fit-cover">` : `<div class="w-100 h-100 d-flex align-items-center justify-content-center"><i class="mdi mdi-account text-secondary" style="font-size: 0.8rem;"></i></div>`}
              </div>-->
              <div class="d-flex flex-column text-body-secondary fs-2 fw-bold" title="${name}">${name}</div>
              <span class="text-warning fw-semibold pt-2">${zoneVal !== null ? `/ ${zoneVal}` : ``}</span>
            </div>
          `;
        })
        .join("");
    } else {
      const noDriversText = window.t ? window.t("realtime_race.queue.no_drivers") : "Nenhum piloto no deck de espera.";
      deckQueueHtml = `<div class="w-100 text-center py-2 text-secondary border border-dashed rounded border-secondary-subtle small fw-medium">${noDriversText}</div>`;
    }

    this.innerHTML = `
      <div class="d-flex flex-row flex-nowrap gap-2 w-100 align-items-center">
        ${deckQueueHtml}
      </div>`;
  }
}

customElements.define(
  "slotrace-realtime-race-queue",
  SlotRaceRealtimeRaceQueue,
);
