class SlotRaceClubLogo extends HTMLElement {
  connectedCallback() {
    this.render();

    // Load initial logo from database
    window.electronAPI.db.get('settings').then(settings => {
      const logo = (settings && settings.local_logo) || '';
      this._updateLogoDisplay(logo);
    }).catch(err => {
      console.error('Failed to load local logo from database:', err);
    });

    // Listen to localLogoChanged event to update dynamically
    this._listener = (e) => {
      this._updateLogoDisplay(e.detail || '');
    };
    window.addEventListener('localLogoChanged', this._listener);
  }

  disconnectedCallback() {
    if (this._listener) {
      window.removeEventListener('localLogoChanged', this._listener);
    }
  }

  render() {
    this.innerHTML = `
      <div id="club-logo-container" class="d-flex align-items-center justify-content-center w-100"></div>
    `;
  }

  _updateLogoDisplay(logoBase64) {
    const container = this.querySelector('#club-logo-container');
    if (!container) return;

    if (logoBase64) {
      container.innerHTML = `
        <img src="${logoBase64}" style="max-height: 200px; max-width: 100%; object-fit: contain;" alt="Club Logo">
      `;
      this.style.display = 'block';
      this.style.marginBottom = '0.5rem';
    } else {
      container.innerHTML = '';
      this.style.display = 'none';
      this.style.marginBottom = '0';
    }
  }
}

customElements.define('slotrace-club-logo', SlotRaceClubLogo);
