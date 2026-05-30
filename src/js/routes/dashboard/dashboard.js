class SlotRaceDashboard extends HTMLElement {
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
      <div class="dashboard-container">
        <div class="row justify-content-center w-100">
          <div class="col-md-8 col-lg-6">
            <div class="p-5 rounded-4 bg-body-tertiary border border-secondary-subtle shadow-lg fade-in">
              <div class="mb-4">
                <!-- MDI Speedometer Icon -->
                <div class="d-inline-flex p-3 bg-danger bg-opacity-10 text-danger rounded-circle mb-3">
                  <i class="mdi mdi-speedometer" style="font-size: 48px; line-height: 1;"></i>
                </div>
                <h1 class="h2 fw-bold text-body-emphasis mb-2">${window.t('dashboard.title')}</h1>
                <p class="text-secondary">${window.t('dashboard.subtitle')}</p>
              </div>
              
              <hr class="my-4 border-secondary-subtle">
              
              <div class="alert alert-dark bg-body-secondary border-secondary-subtle text-start mb-0 py-3" role="alert">
                <h6 class="alert-heading fw-bold text-body-emphasis mb-2 d-flex align-items-center gap-2">
                  <i class="mdi mdi-information-outline text-info fs-5"></i>
                  ${window.t('dashboard.alert_title')}
                </h6>
                <p class="small text-secondary mb-0">${window.t('dashboard.alert_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Define the custom element <slotrace-dashboard>
customElements.define('slotrace-dashboard', SlotRaceDashboard);
