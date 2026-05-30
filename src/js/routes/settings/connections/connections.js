class SlotRaceSettingsConnections extends HTMLElement {
  connectedCallback() {
    this.render();
    
    this._langListener = () => this.render();
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  render() {
    this.innerHTML = `
      <slotrace-settings-header title="${window.t('settings.menu.connections')}" icon="mdi-lan-connect"></slotrace-settings-header>
    `;
  }
}

// Define the custom element <slotrace-settings-connections>
customElements.define('slotrace-settings-connections', SlotRaceSettingsConnections);
