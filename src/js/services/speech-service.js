// Expõe o serviço globalmente
window.speechService = {
  // Configuração padrão
  _enabled: true,
  _voiceName: "",
  _rate: 1.0,

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
        if (settings.speech_rate !== undefined) {
          this._rate = parseFloat(settings.speech_rate) || 1.0;
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

  setRate(rate) {
    this._rate = parseFloat(rate) || 1.0;
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
    if (!this.isEnabled() || !text) return null;

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

    // Ajustes de fala
    utterance.rate = this._rate;
    utterance.pitch = 1.0;  // Tom de voz normal

    window.speechSynthesis.speak(utterance);
    return utterance;
  },

  /**
   * Fala um texto traduzido a partir de uma chave
   * @param {string} key - Chave de tradução
   * @param {boolean} interrupt - Se true, cancela qualquer fala anterior imediatamente
   */
  speak(key, interrupt = true) {
    const texto = window.t(key);
    this.speakText(texto, interrupt);
  },

  /**
   * Plays a synthesized start beep sound using Web Audio API
   */
  playStartBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.02);
      gainNode.gain.setValueAtTime(0.2, context.currentTime + 0.45);
      gainNode.gain.linearRampToValueAtTime(0.0001, context.currentTime + 0.5);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.5);
    } catch (e) {
      console.error('Failed to play beep sound:', e);
    }
  },

  /**
   * Plays a synthesized short lap beep sound using Web Audio API
   */
  playLapBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, context.currentTime);
      
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.08);
    } catch (e) {
      console.error('Failed to play lap beep sound:', e);
    }
  }
};

// Inicializa o serviço
window.speechService.init();
