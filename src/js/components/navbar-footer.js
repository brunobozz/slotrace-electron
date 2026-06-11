class SlotRaceNavbarFooter extends HTMLElement {
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
      <div class="d-flex flex-column gap-1 text-center">
        <div class="small">
          <span class="me-1 text-body-tertiary">${developedByText}</span>
          <strong class="text-body-secondary">BOZZ Company</strong>
        </div>
        <div class="small text-body-tertiary">
          v ${version}
        </div>
      </div>
    `;
  }
}

customElements.define("slotrace-navbar-footer", SlotRaceNavbarFooter);
