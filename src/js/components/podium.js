class SlotRacePodium extends HTMLElement {
  constructor() {
    super();
    this.drivers = []; // Array of up to 3 drivers: [1st, 2nd, 3rd]
  }

  setParams({ drivers }) {
    this.drivers = drivers || [];
    this.render();
  }

  render() {
    const first = this.drivers[0] || null;
    const second = this.drivers[1] || null;
    const third = this.drivers[2] || null;

    const renderDriver = (driver, color) => {
      const name = driver ? driver.nickname || driver.name : "-";
      const photoUrl = driver ? driver.photo : "";
      return `
        <div class="d-flex flex-column align-items-center mb-2 w-100" style="text-align: center;">
          <!-- Driver Photo circle -->
          <div class="rounded-3 img-fluid overflow-hidden bg-body-tertiary shadow-sm position-relative d-flex align-items-center justify-content-center" 
               style="max-width:80%; border: 0px solid ${color}; box-shadow: 0 0 10px ${color}60;">
            ${
              photoUrl
                ? `<img src="${photoUrl}" class="w-100 h-100 object-fit-cover">`
                : `<div class="w-100 h-100 d-flex align-items-center justify-content-center text-secondary bg-body-tertiary">
                     <i class="mdi mdi-account fs-4"></i>
                   </div>`
            }
          </div>
          <span class="fw-bold mt-1.5 text-body-emphasis text-truncate w-100 px-1" style="font-size: 0.8rem; letter-spacing: 0.01em;">
            ${name}
          </span>
        </div>
      `;
    };

    this.innerHTML = `
      <style>
        .podium-container {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 14px;
          width: 100%;
          margin: 0 auto;
          padding: 15px 0 5px 0;
        }
        @keyframes podiumSlideUp {
          from {
            opacity: 0;
            transform: translateY(100%) scale(0.3);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .podium-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          min-width: 80px;
          animation: podiumSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        /* Staggered animation delays (Gold first, then Silver, then Bronze) */
        .podium-column:nth-child(1) {
          animation-delay: 0.2s; /* Silver (2nd) */
        }
        .podium-column:nth-child(2) {
          animation-delay: 0.1s;    /* Gold (1st) */
        }
        .podium-column:nth-child(3) {
          animation-delay: 0.3s; /* Bronze (3rd) */
        }
        .podium-stand {
          width: 100%;
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
        }
        .podium-stand::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%);
          pointer-events: none;
        }
        .podium-number {
          font-family: 'Montserrat', 'Arial Black', sans-serif;
          font-weight: 900;
          font-size: 2rem;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          user-select: none;
        }
      </style>

      <div class="podium-container overflow-hidden">
        <!-- 2º Lugar (Silver) -->
        <div class="podium-column">
          ${renderDriver(second, "#bdc3c7")}
          <div class="podium-stand" style="height: 70px; background: linear-gradient(135deg, #e5e8e8 0%, #95a5a6 100%);">
            <span class="podium-number">2</span>
          </div>
        </div>

        <!-- 1º Lugar (Gold) -->
        <div class="podium-column">
          ${renderDriver(first, "#f1c40f")}
          <div class="podium-stand" style="height: 100px; background: linear-gradient(135deg, #ffe066 0%, #f39c12 100%);">
            <span class="podium-number">1</span>
          </div>
        </div>

        <!-- 3º Lugar (Bronze) -->
        <div class="podium-column">
          ${renderDriver(third, "#bd843aff")}
          <div class="podium-stand" style="height: 48px; background: linear-gradient(135deg, #f5cba7 0%, #d35400 100%);">
            <span class="podium-number">3</span>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("slotrace-podium", SlotRacePodium);
