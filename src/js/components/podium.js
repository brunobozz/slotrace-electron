class SlotRacePodium extends HTMLElement {
  constructor() {
    super();
    this.drivers = []; // Array of up to 3 structured spot objects: [{ driver, car, laps, subtext }]
  }

  setParams({ drivers }) {
    this.drivers = drivers || [];
    this.render();
  }

  render() {
    const first = this.drivers[0] || null;
    const second = this.drivers[1] || null;
    const third = this.drivers[2] || null;

    if (!first && !second && !third) {
      this.innerHTML = `
        <div class="d-flex align-items-center justify-content-center h-100 text-muted py-5" style="min-height: 250px;">
          <div class="text-center">
            <i class="mdi mdi-trophy-outline fs-1 mb-2 d-block text-secondary" style="opacity: 0.6;"></i>
            <div style="font-family: 'Montserrat', sans-serif; font-size: 0.95rem; font-weight: 500;">
              ${window.t("registrations.no_pilots_participated") || "Nenhum piloto participou desta corrida ainda."}
            </div>
          </div>
        </div>
      `;
      return;
    }

    const renderSpot = (spot, rank, color) => {
      if (!spot) return ""; // Do not show card if there is no pilot in this position

      const driver = spot.driver;
      const name = driver ? driver.nickname || driver.name : "-";
      const photoUrl = driver ? driver.photo : "";
      const laps = spot.laps || "-";
      const subtext = spot.subtext || "";

      // Driver Photo/Background HTML
      let driverBgHtml = "";
      if (photoUrl) {
        driverBgHtml = `
          <img src="${photoUrl}" class="driver-pane-photo">
          <div class="podium-pane-overlay"></div>
        `;
      } else {
        // Fallback silhouette
        driverBgHtml = `
          <div class="w-100 h-100 d-flex align-items-end justify-content-center text-secondary bg-body-tertiary rounded-top" style="opacity: 0.15; font-size: 8rem; line-height: 1;">
            <i class="mdi mdi-account"></i>
          </div>
        `;
      }

      // Extract raw number for class (e.g. "1º" -> "1")
      const rankNum = rank[0] || "1";

      return `
        <div class="podium-column rank-${rankNum}">
          <!-- Backdrop pane -->
          <div class="podium-pane" style="border-color: ${color}; box-shadow: 0 0 20px ${color}20;">
            <!-- Rank Badge -->
            <div class="podium-rank" style="color: ${color};">${rank}</div>
            
            <!-- Driver Photo Background -->
            ${driverBgHtml}
          </div>

          <!-- Pedestal (Bezel + Face) -->
          <div class="podium-stand">
            <!-- 3D Bezel shelf displaying driver name -->
            <div class="podium-shelf" style="background: linear-gradient(90deg, ${color}cc 0%, ${color} 50%, ${color}cc 100%);" title="${name}">
              <span class="podium-shelf-name">${name}</span>
            </div>
            <!-- Face details (laps, time/diff) -->
            <div class="podium-face" style="border-color: ${color};">
              <div class="podium-laps">${laps}</div>
              <div class="podium-subtext">${subtext}</div>
            </div>
          </div>
        </div>
      `;
    };

    // Determine layout order based on number of active spots
    let spotsHtml = "";
    if (first && second && third) {
      spotsHtml = `
        ${renderSpot(second, "2º", "#bdc3c7")}
        ${renderSpot(first, "1º", "#f1c40f")}
        ${renderSpot(third, "3º", "#e67e22")}
      `;
    } else if (first && second) {
      spotsHtml = `
        ${renderSpot(first, "1º", "#f1c40f")}
        ${renderSpot(second, "2º", "#bdc3c7")}
      `;
    } else if (first) {
      spotsHtml = `
        ${renderSpot(first, "1º", "#f1c40f")}
      `;
    }

    this.innerHTML = `
      <style>
        .podium-container {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 20px;
          width: 100%;
          margin: 0 auto;
          padding: 25px 0 10px 0;
        }
        @keyframes podiumSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(var(--col-scale, 1));
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(var(--col-scale, 1));
          }
        }
        .podium-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          min-width: 200px;
          max-width: 300px;
          transform-origin: bottom;
          animation: podiumSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        
        /* Apply layout scale factor based on actual rank class */
        .podium-column.rank-2 {
          --col-scale: 0.85;
          animation-delay: 0.15s; /* 2nd place */
          margin-bottom: 20px;
        }
        .podium-column.rank-1 {
          --col-scale: 1.0;
          animation-delay: 0s;    /* 1st place */
        }
        .podium-column.rank-3 {
          --col-scale: 0.85;
          animation-delay: 0.3s;  /* 3rd place */
          margin-bottom: 20px;
        }
        
        .podium-pane {
          width: 100%;
          height: 300px;
          border-top: 2px solid;
          border-left: 2px solid;
          border-right: 2px solid;
          border-radius: 12px 12px 0 0;
          background: linear-gradient(180deg, rgba(25, 25, 30, 0.55) 0%, rgba(12, 12, 14, 0.98) 100%);
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        
        .podium-rank {
          position: absolute;
          top: 5px;
          left: 20px;
          font-family: 'Montserrat', 'Arial Black', sans-serif;
          font-weight: 900;
          font-size: 3rem;
          text-shadow: 0 2px 4px rgba(0,0,0,0.6);
          user-select: none;
          z-index: 3;
        }
        
        .driver-pane-photo {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        
        .podium-pane-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(140deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.05) 50%);
          z-index: 2;
          pointer-events: none;
        }
        
        .podium-stand {
          width: 100%;
          position: relative;
          z-index: 5;
        }
        
        .podium-shelf {
          height: 28px;
          width: 100%;
          border-radius: 2px 2px 0 0;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 6;
          filter: brightness(1.1);
        }
        
        .podium-shelf-name {
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          color: #121212;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          padding: 0 8px;
          text-align: center;
          width: 100%;
        }
        
        .podium-face {
          width: 100%;
          height: 85px;
          background: linear-gradient(180deg, #1b1b1f 0%, #0c0c0e 100%);
          border-left: 2px solid;
          border-right: 2px solid;
          border-bottom: 2px solid;
          border-radius: 0 0 12px 12px;
          padding: 8px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .podium-laps {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
          font-size: 1.5rem;
          color: #ffffff;
          opacity: 0.95;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        
        .podium-subtext {
          font-family: 'Courier New', Courier, monospace;
          font-weight: 700;
          font-size: 0.9rem;
          color: #f8e21bff;
        }
   
        @media (max-width: 768px) {
          .podium-container {
            gap: 10px;
            padding: 10px 0;
          }
          .podium-pane {
            height: 180px !important;
          }
          .podium-rank {
            font-size: 1.5rem;
            top: 8px;
            left: 10px;
          }
          .podium-shelf-name {
            font-size: 0.75rem;
          }
          .podium-shelf {
            height: 24px;
          }
          .podium-laps {
            font-size: 0.75rem;
          }
          .podium-subtext {
            font-size: 0.65rem;
          }
          .podium-face {
            height: 60px !important;
            padding: 6px 4px;
          }
        }
      </style>

      <div class="podium-container">
        ${spotsHtml}
      </div>
    `;
  }
}

customElements.define("slotrace-podium", SlotRacePodium);
