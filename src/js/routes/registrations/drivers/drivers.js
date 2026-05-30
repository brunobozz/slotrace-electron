class SlotRaceRegistrationsDrivers extends HTMLElement {
  connectedCallback() {
    this.render();
    
    // Bind modal and form events
    this.setupEvents();
    
    this._langListener = () => {
      this.render();
      this.setupEvents();
    };
    window.addEventListener('languageChanged', this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
  }

  render() {
    this.innerHTML = `
      <div class="d-flex justify-content-end mb-3">
        <button id="btn-new-driver" class="btn btn-primary px-4 py-2.5 fw-semibold d-flex align-items-center gap-2">
          <i class="mdi mdi-plus-circle-outline fs-5"></i>
          ${window.t('registrations.new_driver')}
        </button>
      </div>

      <!-- Drivers List Grid -->
      <slotrace-registrations-drivers-list class="mt-4 d-block"></slotrace-registrations-drivers-list>

      <!-- Centered Driver Registration Modal -->
      <div class="modal fade" id="modal-new-driver" tabindex="-1" aria-labelledby="modal-new-driver-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary-subtle">
            
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-new-driver-title">
                <i class="mdi mdi-account-plus text-danger fs-4"></i>
                ${window.t('registrations.modal.new_driver_title')}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <div class="modal-body">
              <form id="form-new-driver" class="needs-validation" novalidate>
                
                <!-- Circular Photo Picker -->
                <div class="mb-4 text-center">
                  <div class="d-inline-block position-relative">
                    <!-- Circular image container -->
                    <div class="rounded-circle border border-secondary-subtle shadow-sm overflow-hidden d-flex align-items-center justify-content-center bg-body-secondary position-relative" style="width: 110px; height: 110px; border-width: 2px !important;">
                      <img id="img-driver-preview" src="" class="d-none w-100 h-100 object-fit-cover">
                      <i id="icon-driver-placeholder" class="mdi mdi-account text-secondary-50" style="font-size: 64px; line-height: 1;"></i>
                    </div>
                    
                    <!-- Camera overlay badge -->
                    <label for="input-driver-photo" class="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 p-0 d-flex align-items-center justify-content-center shadow-sm" style="width: 34px; height: 34px; cursor: pointer; border: 3px solid var(--bs-body-bg);" title="${window.t('registrations.modal.photo_label')}">
                      <i class="mdi mdi-camera fs-6"></i>
                    </label>
                  </div>
                  
                  <!-- Hidden input file -->
                  <input type="file" id="input-driver-photo" class="d-none" accept="image/*">
                  <div class="small text-secondary mt-2">${window.t('registrations.modal.photo_help')}</div>
                </div>
                
                <!-- Driver Name input -->
                <div class="mb-3">
                  <label for="input-driver-name" class="form-label fw-semibold text-secondary small">${window.t('registrations.modal.name_label')}</label>
                  <input type="text" class="form-control p-2.5" id="input-driver-name" placeholder="${window.t('registrations.modal.name_placeholder')}" required>
                  <div class="invalid-feedback">Please enter a valid driver name.</div>
                </div>
                
                <!-- Driver Nickname input -->
                <div class="mb-4">
                  <label for="input-driver-nickname" class="form-label fw-semibold text-secondary small">${window.t('registrations.modal.nickname_label')}</label>
                  <input type="text" class="form-control p-2.5" id="input-driver-nickname" placeholder="${window.t('registrations.modal.nickname_placeholder')}">
                </div>

                
                <!-- Modal Actions -->
                <div class="d-flex justify-content-end gap-2 border-top border-secondary-subtle pt-3">
                  <button type="button" class="btn btn-secondary px-4 py-2.5 fw-semibold" data-bs-dismiss="modal">${window.t('registrations.modal.cancel_button')}</button>
                  <button type="submit" class="btn btn-primary px-4 py-2.5 fw-semibold d-flex align-items-center gap-2">
                    <i class="mdi mdi-content-save-outline fs-5"></i>
                    ${window.t('registrations.modal.save_button')}
                  </button>
                </div>
                
              </form>
            </div>
            
          </div>
        </div>
      </div>
    `;
  }

  setupEvents() {
    const modalEl = this.querySelector('#modal-new-driver');
    const btnNewDriver = this.querySelector('#btn-new-driver');
    const form = this.querySelector('#form-new-driver');
    const fileInput = this.querySelector('#input-driver-photo');
    const imgPreview = this.querySelector('#img-driver-preview');
    const iconPlaceholder = this.querySelector('#icon-driver-placeholder');
    
    let driverPhotoBase64 = '';

    // Handle click on "New Driver" button to open modal
    if (btnNewDriver && modalEl) {
      btnNewDriver.addEventListener('click', () => {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show();
      });
    }

    // Handle profile photo selection and base64 preview rendering
    if (fileInput && imgPreview && iconPlaceholder) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            driverPhotoBase64 = event.target.result;
            imgPreview.src = driverPhotoBase64;
            imgPreview.classList.remove('d-none');
            iconPlaceholder.classList.add('d-none');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Handle form submit and database persistence
    if (form && modalEl) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }

        const nameInput = this.querySelector('#input-driver-name');
        const nicknameInput = this.querySelector('#input-driver-nickname');
        const nameVal = nameInput ? nameInput.value.trim() : '';
        const nicknameVal = nicknameInput ? nicknameInput.value.trim() : '';

        // Save asynchronously in Node.js local database
        window.electronAPI.db.get('drivers').then(drivers => {
          const driversList = drivers || [];
          
          const newDriver = {
            id: Date.now().toString(),
            name: nameVal,
            nickname: nicknameVal,
            photo: driverPhotoBase64 || '',
            gps: 0,
            laps: 0
          };
          
          driversList.push(newDriver);
          return window.electronAPI.db.set('drivers', driversList);
        }).then(success => {
          if (success) {
            // Hide modal on success
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }
            // Dispatch dynamic event to notify list reactively
            window.dispatchEvent(new CustomEvent('driverAdded'));
          }
        }).catch(err => {
          console.error('Failed to register driver in database:', err);
        });
      });

      // Clear form inputs and photo preview cache when modal is closed
      modalEl.addEventListener('hidden.bs.modal', () => {
        form.reset();
        form.classList.remove('was-validated');
        driverPhotoBase64 = '';
        if (imgPreview && iconPlaceholder) {
          imgPreview.src = '';
          imgPreview.classList.add('d-none');
          iconPlaceholder.classList.remove('d-none');
        }
      });
    }
  }
}

// Define the custom element <slotrace-registrations-drivers>
customElements.define('slotrace-registrations-drivers', SlotRaceRegistrationsDrivers);
