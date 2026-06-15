class SlotRaceSettingsConnections extends HTMLElement {
  constructor() {
    super();
    this.ports = [];
    this.status = { status: "disconnected", path: null, baudRate: null };
    this._dataCleanup = null;
    this._statusCleanup = null;
  }

  connectedCallback() {
    this.init();
  }

  disconnectedCallback() {
    this.cleanupListeners();
  }

  cleanupListeners() {
    if (this._dataCleanup) {
      this._dataCleanup();
      this._dataCleanup = null;
    }
    if (this._statusCleanup) {
      this._statusCleanup();
      this._statusCleanup = null;
    }
  }

  async init() {
    this.render();

    // Register event listeners
    this.cleanupListeners();

    if (window.electronAPI && window.electronAPI.serial) {
      this._dataCleanup = window.electronAPI.serial.onData((data) => {
        this.addLog(data);
      });

      this._statusCleanup = window.electronAPI.serial.onStatusChange(
        (status) => {
          this.status = status;
          this.updateStatusDisplay();
        },
      );

      try {
        // Get initial status
        this.status = await window.electronAPI.serial.getStatus();
        this.updateStatusDisplay();
      } catch (err) {
        console.error("Failed to get serial status:", err);
      }

      await this.refreshPorts();
    }

    this.setupFormEvents();
  }

  async refreshPorts() {
    if (!window.electronAPI || !window.electronAPI.serial) return;

    const refreshBtn = this.querySelector("#btn-refresh-ports");
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<i class="mdi mdi-refresh mdi-spin me-1"></i>...';
    }

    try {
      const ports = await window.electronAPI.serial.listPorts();
      this.ports = ports || [];
      this.updatePortsSelect();
    } catch (err) {
      this.addLog(`[ERRO] Falha ao listar portas seriais: ${err.message}`);
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML =
          '<i class="mdi mdi-refresh me-1"></i>Atualizar Portas';
      }
    }
  }

  updatePortsSelect() {
    const selectPort = this.querySelector("#select-port");
    if (!selectPort) return;

    const savedPath = this.status.path || "";

    let html = `<option value="SIMULAÇÃO" ${savedPath === "SIMULAÇÃO" ? "selected" : ""}>SIMULAÇÃO (Dados de Teste)</option>`;

    this.ports.forEach((port) => {
      const selected = port.path === savedPath ? "selected" : "";
      const friendlyName = port.friendlyName
        ? `${port.path} - ${port.friendlyName}`
        : port.path;
      html += `<option value="${port.path}" ${selected}>${friendlyName}</option>`;
    });

    selectPort.innerHTML = html;
  }

  updateStatusDisplay() {
    const statusBadge = this.querySelector("#status-badge");
    const connectBtn = this.querySelector("#btn-connect-serial");
    const disconnectBtn = this.querySelector("#btn-disconnect-serial");
    const selectPort = this.querySelector("#select-port");
    const selectBaud = this.querySelector("#select-baud");

    if (!statusBadge || !connectBtn || !disconnectBtn) return;

    const isConnected = this.status.status === "connected";

    if (isConnected) {
      const modeText =
        this.status.path === "SIMULAÇÃO"
          ? "Conectado (Simulação)"
          : `Conectado na ${this.status.path}`;
      statusBadge.className = "badge bg-success px-3 py-2 fs-7";
      statusBadge.innerHTML = `<i class="mdi mdi-check-circle me-1"></i>${modeText}`;

      connectBtn.disabled = true;
      disconnectBtn.disabled = false;
      if (selectPort) selectPort.disabled = true;
      if (selectBaud) selectBaud.disabled = true;
    } else {
      statusBadge.className = "badge bg-danger px-3 py-2 fs-7";
      statusBadge.innerHTML =
        '<i class="mdi mdi-close-circle me-1"></i>Desconectado';

      connectBtn.disabled = false;
      disconnectBtn.disabled = true;
      if (selectPort) selectPort.disabled = false;
      if (selectBaud) selectBaud.disabled = false;
    }
  }

  setupFormEvents() {
    const connectBtn = this.querySelector("#btn-connect-serial");
    const disconnectBtn = this.querySelector("#btn-disconnect-serial");
    const clearBtn = this.querySelector("#btn-clear-console");
    const refreshBtn = this.querySelector("#btn-refresh-ports");

    if (connectBtn) {
      connectBtn.addEventListener("click", async () => {
        const selectPort = this.querySelector("#select-port");
        const selectBaud = this.querySelector("#select-baud");
        if (!selectPort || !selectBaud) return;

        const path = selectPort.value;
        const baudRate = parseInt(selectBaud.value) || 9600;

        this.addLog(
          `[CONEXÃO] Tentando conectar a ${path} a ${baudRate} bps...`,
        );
        connectBtn.disabled = true;

        try {
          const res = await window.electronAPI.serial.connect(path, baudRate);
          if (res.success) {
            this.addLog(`[CONEXÃO] Conectado com sucesso em modo ${res.mode}!`);
          } else {
            this.addLog(`[ERRO] Falha na conexão: ${res.error}`);
            this.status = {
              status: "disconnected",
              path: null,
              baudRate: null,
            };
            this.updateStatusDisplay();
          }
        } catch (err) {
          this.addLog(`[ERRO] Exceção na conexão: ${err.message}`);
          this.status = { status: "disconnected", path: null, baudRate: null };
          this.updateStatusDisplay();
        }
      });
    }

    if (disconnectBtn) {
      disconnectBtn.addEventListener("click", async () => {
        this.addLog(`[CONEXÃO] Desconectando...`);
        disconnectBtn.disabled = true;

        try {
          await window.electronAPI.serial.disconnect();
          this.addLog(`[CONEXÃO] Desconectado.`);
        } catch (err) {
          this.addLog(`[ERRO] Falha ao desconectar: ${err.message}`);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const consoleEl = this.querySelector("#console-log");
        if (consoleEl) {
          consoleEl.innerHTML = "";
        }
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refreshPorts());
    }
  }

  addLog(message) {
    const consoleEl = this.querySelector("#console-log");
    if (!consoleEl) return;

    const date = new Date();
    const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`;

    const logDiv = document.createElement("div");
    logDiv.className =
      "py-0.5 border-bottom border-secondary-subtle border-opacity-10";
    logDiv.innerHTML = `<span class="text-secondary">[${timeStr}]</span> <span class="text-white-50">${this.escapeHtml(message)}</span>`;

    consoleEl.appendChild(logDiv);

    const autoscrollCheck = this.querySelector("#check-autoscroll");
    if (autoscrollCheck && autoscrollCheck.checked) {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  render() {
    this.innerHTML = `
      <slotrace-settings-header title="${window.t("settings.menu.connections") || "Conexões"}" icon="mdi-lan-connect"></slotrace-settings-header>
      
        <!-- Settings card -->
        <div>
          <div class="card-body">            
            <div class="row">
              <div class="col-7">
                <!-- Port Selection -->
                <div class="mb-3">
                  <label for="select-port" class="form-label text-secondary small fw-semibold">Porta USB / Serial</label>
                  <div class="input-group">
                    <select id="select-port" class="form-select border-secondary-subtle bg-body-secondary text-body-emphasis">
                      <option value="SIMULAÇÃO">SIMULAÇÃO (Dados de Teste)</option>
                    </select>
                    <button id="btn-refresh-ports" class="btn btn-secondary flex-shrink-0 d-flex align-items-center" title="Refresh">
                      <i class="mdi mdi-refresh me-1"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-5">
                <!-- Baud Rate Selection -->
                <div class="mb-3">
                  <label for="select-baud" class="form-label text-secondary small fw-semibold">Velocidade (Baud Rate)</label>
                  <select id="select-baud" class="form-select border-secondary-subtle bg-body-secondary text-body-emphasis">
                    <option value="9600" selected>9600 bps (Padrão Arduino)</option>
                    <option value="19200">19200 bps</option>
                    <option value="38400">38400 bps</option>
                    <option value="57600">57600 bps</option>
                    <option value="115200">115200 bps (Alto Desempenho)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Terminal log card -->
        <div class="card bg-body-tertiary border-secondary-subtle shadow-sm h-100">
          <div class="card-body d-flex flex-column h-100" style="min-height: 380px;">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h6 class="fw-bold text-body-emphasis mb-0"><i class="mdi mdi-console-line text-primary me-1.5"></i>Terminal de Monitoramento</h6>
              <div class="d-flex align-items-center gap-3">
                <div class="form-check form-switch mb-0 fs-7">
                  <input class="form-check-input" type="checkbox" id="check-autoscroll" checked>
                  <label class="form-check-label text-secondary" for="check-autoscroll">Auto-scroll</label>
                </div>
                <button id="btn-clear-console" class="btn btn-sm btn-outline-secondary py-1" style="font-size: 0.75rem;">
                  <i class="mdi mdi-delete-sweep-outline me-1"></i>Limpar
                </button>
              </div>
            </div>
            
            <!-- Status Badge Area -->
            <div class="mb-3 d-flex align-items-center justify-content-between py-2 border-top border-bottom border-secondary border-opacity-10">
              <span class="text-secondary small fw-semibold text-uppercase">Status de Conexão</span>
              <span id="status-badge" class="badge bg-danger px-3 py-2 fs-7">
                <i class="mdi mdi-close-circle me-1"></i>Desconectado
              </span>
            </div>

            <!-- Console Log Container -->
            <div id="console-log" class="flex-grow-1 bg-dark rounded border border-secondary border-opacity-25 p-3 overflow-y-auto font-monospace text-success fs-7" style="height: 260px; max-height: 300px; line-height: 1.4;">
              <div class="text-secondary opacity-50 py-0.5">Console pronto para monitoramento. Selecione uma porta e conecte...</div>
            </div>

            <!-- Action Buttons -->
            <div class="d-flex gap-3 mt-3">
              <button id="btn-connect-serial" class="btn btn-success flex-grow-1 fw-bold d-flex align-items-center justify-content-center py-2 shadow-sm">
                <i class="mdi mdi-play-circle-outline fs-5 me-1.5"></i>Conectar
              </button>
              <button id="btn-disconnect-serial" class="btn btn-danger flex-grow-1 fw-bold d-flex align-items-center justify-content-center py-2 shadow-sm" disabled>
                <i class="mdi mdi-stop-circle-outline fs-5 me-1.5"></i>Desconectar
              </button>
            </div>

          </div>
        </div>
      </div>
    `;
  }
}

// Define the custom element <slotrace-settings-connections>
customElements.define(
  "slotrace-settings-connections",
  SlotRaceSettingsConnections,
);
