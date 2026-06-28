class SlotRaceSettingsMenu extends HTMLElement {
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
      <div class="nav flex-column nav-pills" id="v-pills-settings-menu" role="tablist" aria-orientation="vertical">
        <a class="nav-link d-flex align-items-center gap-2" id="subnav-informations" href="#settings/informations">
          <i class="mdi mdi-information-outline fs-5"></i>
          <span>${window.t('settings.menu.informations')}</span>
        </a>
        <a class="nav-link d-flex align-items-center gap-2" id="subnav-preferences" href="#settings/preferences">
          <i class="mdi mdi-tune fs-5"></i>
          <span>${window.t('settings.menu.preferences')}</span>
        </a>
        <a class="nav-link d-flex align-items-center gap-2" id="subnav-language-voice" href="#settings/language-voice">
          <i class="mdi mdi-translate fs-5"></i>
          <span>${window.t('settings.menu.language_voice')}</span>
        </a>
        <a class="nav-link d-flex align-items-center gap-2" id="subnav-sound-signals" href="#settings/sound-signals">
          <i class="mdi mdi-volume-high fs-5"></i>
          <span>${window.t('settings.menu.sound_signals')}</span>
        </a>
        <a class="nav-link d-flex align-items-center gap-2" id="subnav-connections" href="#settings/connections">
          <i class="mdi mdi-lan-connect fs-5"></i>
          <span>${window.t('settings.menu.connections')}</span>
        </a>
      </div>
    `;
    
    // Restore active states based on current route
    const hash = window.location.hash || '';
    const parts = hash.replace('#', '').split('/');
    const activeSubRoute = (parts[0] === 'settings' && parts[1]) ? parts[1] : 'informations';
    
    const subnavInfo = this.querySelector('#subnav-informations');
    const subnavPref = this.querySelector('#subnav-preferences');
    const subnavLangVoice = this.querySelector('#subnav-language-voice');
    const subnavSoundSigs = this.querySelector('#subnav-sound-signals');
    const subnavConn = this.querySelector('#subnav-connections');
    
    if (subnavInfo && subnavPref && subnavLangVoice && subnavSoundSigs && subnavConn) {
      subnavInfo.classList.remove('active');
      subnavPref.classList.remove('active');
      subnavLangVoice.classList.remove('active');
      subnavSoundSigs.classList.remove('active');
      subnavConn.classList.remove('active');
      
      if (activeSubRoute === 'preferences') {
        subnavPref.classList.add('active');
      } else if (activeSubRoute === 'language-voice') {
        subnavLangVoice.classList.add('active');
      } else if (activeSubRoute === 'sound-signals') {
        subnavSoundSigs.classList.add('active');
      } else if (activeSubRoute === 'connections') {
        subnavConn.classList.add('active');
      } else {
        subnavInfo.classList.add('active');
      }
    }
  }
}

// Define the custom element <slotrace-settings-menu>
customElements.define("slotrace-settings-menu", SlotRaceSettingsMenu);
