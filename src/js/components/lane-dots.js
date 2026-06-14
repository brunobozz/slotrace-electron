class SlotRaceLaneDots extends HTMLElement {
  constructor() {
    super();
    this.laneCount = 0;
    this.laneColors = [];
  }

  setParams({ laneCount, laneColors }) {
    this.laneCount = parseInt(laneCount) || 0;
    this.laneColors = laneColors || [];
    this.render();
  }

  setTrack(track) {
    if (track) {
      this.laneCount = parseInt(track.lanes) || 0;
      this.laneColors = track.laneColors || [];
    } else {
      this.laneCount = 0;
      this.laneColors = [];
    }
    this.render();
  }

  render() {
    if (this.laneCount <= 0) {
      this.innerHTML = "";
      this.style.display = "none";
      return;
    }

    const defaultColors = [
      "#ff3b30",
      "#007aff",
      "#34c759",
      "#ffcc00",
      "#ff9500",
      "#ffffff",
      "#af52de",
      "#8e8e93",
    ];

    this.classList.add(
      "d-flex",
      "align-items-center",
      "bg-black",
      "bg-opacity-65",
      "rounded-pill",
      "shadow-sm",
    );
    this.style.display = "flex";
    this.style.border = "1px solid rgba(255,255,255,0.18)";
    this.style.padding = "5px 10px";
    this.style.gap = "6px";
    this.style.width = "max-content";

    this.innerHTML = Array.from({ length: this.laneCount })
      .map((_, i) => {
        const colorHex =
          this.laneColors[i] || defaultColors[i % defaultColors.length];
        return `<span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: ${colorHex}; border: 1.5px solid rgba(255,255,255,0.30); box-shadow: 0 0 5px ${colorHex}a0;"></span>`;
      })
      .join("");
  }
}

customElements.define("slotrace-lane-dots", SlotRaceLaneDots);
