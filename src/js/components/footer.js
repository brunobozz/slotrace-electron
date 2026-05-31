class SlotRaceFooter extends HTMLElement {
  connectedCallback() {
    this.render();

    this._langListener = () => this.render();
    window.addEventListener("languageChanged", this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
  }

  render() {
    const version = window.electronAPI
      ? window.electronAPI.appVersion
      : "0.0.1";
    const developedByText =
      window.t("footer.developed_by") || "Desenvolvido por";

    this.innerHTML = `
      <footer class="mt-5 p-3 pt-2 pb-2 bg-dark">
        <div class="d-flex justify-content-between align-items-center text-secondary" style="font-size: 0.75rem; opacity: 0.8;">
          <div>
            <span class="me-1">${developedByText}</span> <strong class="text-body-emphasis">BOZZ Company</strong>
          </div>
          <div class="fw-semibold text-body-emphasis">
            v ${version}
          </div>
        </div>
      </footer>
    `;
  }
}

customElements.define("slotrace-footer", SlotRaceFooter);
