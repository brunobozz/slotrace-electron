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
  playStartBeep(duration = 0.5, frequency = 800) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      
      const attack = Math.min(0.02, duration * 0.1);
      const release = Math.min(0.05, duration * 0.1);
      const holdTime = duration - release;
      
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + attack);
      gainNode.gain.setValueAtTime(0.2, context.currentTime + holdTime);
      gainNode.gain.linearRampToValueAtTime(0.0001, context.currentTime + duration);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + duration);
    } catch (e) {
      console.error('Failed to play beep sound:', e);
    }
  },

  /**
   * Plays a synthesized short lap beep sound using Web Audio API
   */
  playLapBeep(duration = 0.08, frequency = 1200) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const context = new AudioCtx();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      
      const attack = Math.min(0.01, duration * 0.1);
      
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, context.currentTime + attack);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + duration);
    } catch (e) {
      console.error('Failed to play lap beep sound:', e);
    }
  }
};

// Inicializa o serviço
window.speechService.init();
