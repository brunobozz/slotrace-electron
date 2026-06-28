// Expõe o serviço globalmente
window.speechService = {
  // Configuração padrão
  _enabled: true,
  _voiceName: "",

  init() {
    // Carrega a preferência de áudio do banco de dados (se habilitado ou não nas configurações)
    window.electronAPI.db.get('settings').then(settings => {
      if (settings) {
        if (settings.speech_enabled !== undefined) {
          this._enabled = settings.speech_enabled;
        }
        if (settings.speech_voice !== undefined) {
          this._voiceName = settings.speech_voice;
        }
      }
    }).catch((err) => {
      console.error('Failed to load speech settings from database:', err);
      this._enabled = true; // Fallback ativo
    });
  },

  setEnabled(status) {
    this._enabled = status;
    // Salva no banco
    window.electronAPI.db.get('settings').then(settings => {
      const updated = settings || {};
      updated.speech_enabled = status;
      return window.electronAPI.db.set('settings', updated);
    });
  },

  setVoice(voiceName) {
    this._voiceName = voiceName;
  },

  isEnabled() {
    return this._enabled && 'speechSynthesis' in window;
  },

  /**
   * Fala um texto bruto
   * @param {string} text - Texto a ser falado
   * @param {boolean} interrupt - Se true, cancela qualquer fala anterior imediatamente
   */
  speakText(text, interrupt = true) {
    if (!this.isEnabled() || !text) return;

    // Cancela falas anteriores imediatamente se solicitado (evita acumular áudios atrasados)
    if (interrupt) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Define o idioma com base no idioma atual do app
    utterance.lang = window.currentLanguage || 'pt';

    // Procura e define a voz selecionada se houver
    if (this._voiceName) {
      const vozes = window.speechSynthesis.getVoices();
      const vozSelecionada = vozes.find(v => v.name === this._voiceName);
      if (vozSelecionada) {
        utterance.voice = vozSelecionada;
      }
    }

    // Ajustes premium de fala (padrões confortáveis)
    utterance.rate = 1.05;  // Velocidade ligeiramente mais rápida para dinâmica de corrida
    utterance.pitch = 1.0;  // Tom de voz normal

    window.speechSynthesis.speak(utterance);
  },

  /**
   * Fala um texto traduzido a partir de uma chave
   * @param {string} key - Chave de tradução
   * @param {boolean} interrupt - Se true, cancela qualquer fala anterior imediatamente
   */
  speak(key, interrupt = true) {
    const texto = window.t(key);
    this.speakText(texto, interrupt);
  }
};

// Inicializa o serviço
window.speechService.init();
