class SlotRaceRegistrationsDriversCreateModal extends HTMLElement {
  connectedCallback() {
    this.editDriverId = '';
    this.driverPhotoBase64 = '';
    
    this.render();
    this.setupEvents();
    
    this._langListener = () => {
      this.render();
      this.setupEvents();
    };
    
    this._editRequestListener = (e) => {
      const { driver } = e.detail;
      this.editDriverId = driver.id;
      
      // Populate fields
      const nameInput = this.querySelector('#input-driver-name');
      const nicknameInput = this.querySelector('#input-driver-nickname');
      const imgPreview = this.querySelector('#img-driver-preview');
      const iconPlaceholder = this.querySelector('#icon-driver-placeholder');
      
      if (nameInput) nameInput.value = driver.name || '';
      if (nicknameInput) nicknameInput.value = driver.nickname || '';
      
      if (driver.photo) {
        this.driverPhotoBase64 = driver.photo;
        if (imgPreview && iconPlaceholder) {
          imgPreview.src = driver.photo;
          imgPreview.classList.remove('d-none');
          iconPlaceholder.classList.add('d-none');
        }
      } else {
        this.driverPhotoBase64 = '';
        if (imgPreview && iconPlaceholder) {
          imgPreview.src = '';
          imgPreview.classList.add('d-none');
          iconPlaceholder.classList.remove('d-none');
        }
      }
      
      // Update modal title and save button text dynamically!
      const titleEl = this.querySelector('#modal-new-driver-title');
      const submitBtnEl = this.querySelector('#btn-submit-driver');
      
      if (titleEl) {
        titleEl.innerHTML = `<i class="mdi mdi-account-edit text-danger fs-4"></i> ${window.t('registrations.modal.edit_driver_title')}`;
      }
      if (submitBtnEl) {
        submitBtnEl.innerHTML = `<i class="mdi mdi-content-save-outline fs-5"></i> ${window.t('registrations.modal.save_changes_button')}`;
      }
      
      this.show();
    };
    
    window.addEventListener('languageChanged', this._langListener);
    window.addEventListener('requestEditDriver', this._editRequestListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._editRequestListener) {
      window.removeEventListener('requestEditDriver', this._editRequestListener);
    }
  }

  show() {
    const modalEl = this.querySelector('#modal-new-driver');
    if (modalEl) {
      let modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalEl);
      }
      modalInstance.show();
    }
  }

  setupEvents() {
    const modalEl = this.querySelector('#modal-new-driver');
    const form = this.querySelector('#form-new-driver');
    const fileInput = this.querySelector('#input-driver-photo');
    const imgPreview = this.querySelector('#img-driver-preview');
    const iconPlaceholder = this.querySelector('#icon-driver-placeholder');
    
    // Reset local cache reference
    this.driverPhotoBase64 = this.driverPhotoBase64 || '';

    // Handle profile photo selection and base64 preview rendering (delegates to dynamic crop modal)
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.initCropper(event.target.result);
            fileInput.value = ''; // Reset input to allow triggering change on same file
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
          
          if (this.editDriverId) {
            // Edit Mode
            const driverIndex = driversList.findIndex(d => d.id === this.editDriverId);
            if (driverIndex !== -1) {
              driversList[driverIndex].name = nameVal;
              driversList[driverIndex].nickname = nicknameVal;
              driversList[driverIndex].photo = this.driverPhotoBase64 || '';
              // Keep original gps and laps intact!
            }
          } else {
            // Create Mode
            const newDriver = {
              id: Date.now().toString(),
              name: nameVal,
              nickname: nicknameVal,
              photo: this.driverPhotoBase64 || '',
              gps: 0,
              laps: 0,
              best_laps: 0
            };
            driversList.push(newDriver);
          }
          
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
          console.error('Failed to save driver in database:', err);
        });
      });

      // Clear form inputs and photo preview cache when modal is closed
      modalEl.addEventListener('hidden.bs.modal', () => {
        form.reset();
        form.classList.remove('was-validated');
        this.driverPhotoBase64 = '';
        this.editDriverId = '';
        
        // Restore title and button to default (Create Mode)
        const titleEl = this.querySelector('#modal-new-driver-title');
        const submitBtnEl = this.querySelector('#btn-submit-driver');
        if (titleEl) {
          titleEl.innerHTML = `<i class="mdi mdi-account-plus text-danger fs-4"></i> ${window.t('registrations.modal.new_driver_title')}`;
        }
        if (submitBtnEl) {
          submitBtnEl.innerHTML = `<i class="mdi mdi-content-save-outline fs-5"></i> ${window.t('registrations.modal.save_button')}`;
        }
        
        if (imgPreview && iconPlaceholder) {
          imgPreview.src = '';
          imgPreview.classList.add('d-none');
          iconPlaceholder.classList.remove('d-none');
        }
      });
    }
  }

  initCropper(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      this.srcImage = img;
      this.zoom = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      
      const cropModalEl = this.querySelector('#modal-crop-image');
      if (cropModalEl) {
        let cropModalInstance = bootstrap.Modal.getInstance(cropModalEl);
        if (!cropModalInstance) {
          cropModalInstance = new bootstrap.Modal(cropModalEl);
        }
        cropModalInstance.show();
        this.setupCropCanvas();
      }
    };
  }

  setupCropCanvas() {
    const canvas = this.querySelector('#crop-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const zoomSlider = this.querySelector('#crop-zoom-slider');
    const zoomValue = this.querySelector('#zoom-value');
    const applyBtn = this.querySelector('#btn-apply-crop');
    
    if (zoomSlider) zoomSlider.value = 1;
    if (zoomValue) zoomValue.textContent = '1.0x';
    
    const img = this.srcImage;
    const canvasSize = 320;
    const cropRadius = 130;
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    
    const scale = Math.max(canvasSize / img.width, canvasSize / img.height);
    const baseWidth = img.width * scale;
    const baseHeight = img.height * scale;
    
    this.offsetX = (canvasSize - baseWidth) / 2;
    this.offsetY = (canvasSize - baseHeight) / 2;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      const w = baseWidth * this.zoom;
      const h = baseHeight * this.zoom;
      
      // Auto-bound dragging offsets before rendering
      if (w >= 2 * cropRadius) {
        if (this.offsetX > centerX - cropRadius) this.offsetX = centerX - cropRadius;
        if (this.offsetX + w < centerX + cropRadius) this.offsetX = centerX + cropRadius - w;
      } else {
        // Center horizontally if zoomed out smaller than crop circle
        this.offsetX = centerX - w / 2;
      }
      
      if (h >= 2 * cropRadius) {
        if (this.offsetY > centerY - cropRadius) this.offsetY = centerY - cropRadius;
        if (this.offsetY + h < centerY + cropRadius) this.offsetY = centerY + cropRadius - h;
      } else {
        // Center vertically if zoomed out smaller than crop circle
        this.offsetY = centerY - h / 2;
      }
      
      ctx.drawImage(img, this.offsetX, this.offsetY, w, h);
      
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.rect(0, 0, canvasSize, canvasSize);
      ctx.arc(centerX, centerY, cropRadius, 0, Math.PI * 2, true);
      ctx.fill();
      
      ctx.strokeStyle = '#dc3545';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, cropRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };
    
    draw();
    
    const onZoomChange = (e) => {
      const oldZoom = this.zoom;
      this.zoom = parseFloat(e.target.value);
      if (zoomValue) zoomValue.textContent = `${this.zoom.toFixed(1)}x`;
      
      const zoomRatio = this.zoom / oldZoom;
      this.offsetX = centerX - (centerX - this.offsetX) * zoomRatio;
      this.offsetY = centerY - (centerY - this.offsetY) * zoomRatio;
      
      draw();
    };
    if (zoomSlider) {
      zoomSlider.oninput = onZoomChange;
    }
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    
    canvas.onpointerdown = (e) => {
      isDragging = true;
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(e.pointerId);
      startX = e.clientX - this.offsetX;
      startY = e.clientY - this.offsetY;
    };
    
    canvas.onpointermove = (e) => {
      if (!isDragging) return;
      this.offsetX = e.clientX - startX;
      this.offsetY = e.clientY - startY;
      draw();
    };
    
    const stopDragging = (e) => {
      if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'grab';
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    };
    canvas.onpointerup = stopDragging;
    canvas.onpointercancel = stopDragging;
    
    if (applyBtn) {
      applyBtn.onclick = () => {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = 400;
        cropCanvas.height = 400;
        const cropCtx = cropCanvas.getContext('2d');
        
        // Fill canvas with a black background so outer empty areas are clean
        cropCtx.fillStyle = '#09090b'; 
        cropCtx.fillRect(0, 0, 400, 400);
        
        // Scale factor between the 320x320 crop modal canvas and our high-res 400x400 output canvas
        const outputScale = 400 / (2 * cropRadius);
        const cropStartX = centerX - cropRadius; // 30
        const cropStartY = centerY - cropRadius; // 30
        
        const destX = (this.offsetX - cropStartX) * outputScale;
        const destY = (this.offsetY - cropStartY) * outputScale;
        const destW = baseWidth * this.zoom * outputScale;
        const destH = baseHeight * this.zoom * outputScale;
        
        cropCtx.drawImage(img, destX, destY, destW, destH);
        
        this.driverPhotoBase64 = cropCanvas.toDataURL('image/jpeg', 0.85);
        
        const imgPreview = this.querySelector('#img-driver-preview');
        const iconPlaceholder = this.querySelector('#icon-driver-placeholder');
        if (imgPreview && iconPlaceholder) {
          imgPreview.src = this.driverPhotoBase64;
          imgPreview.classList.remove('d-none');
          iconPlaceholder.classList.add('d-none');
        }
        
        const cropModalEl = this.querySelector('#modal-crop-image');
        if (cropModalEl) {
          const cropModalInstance = bootstrap.Modal.getInstance(cropModalEl);
          if (cropModalInstance) {
            cropModalInstance.hide();
          }
        }
      };
    }
  }

  render() {
    this.innerHTML = `
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
                <div class="d-flex justify-content-end gap-2 pt-3">
                  <button type="button" class="btn btn-secondary px-4 py-2.5 fw-semibold" data-bs-dismiss="modal">${window.t('registrations.modal.cancel_button')}</button>
                  <button type="submit" id="btn-submit-driver" class="btn btn-primary px-4 py-2.5 fw-semibold d-flex align-items-center gap-2">
                    <i class="mdi mdi-content-save-outline fs-5"></i>
                    ${window.t('registrations.modal.save_button')}
                  </button>
                </div>
                
              </form>
            </div>
            
          </div>
        </div>
      </div>

      <!-- Native Circular Image Cropping Modal -->
      <div class="modal fade" id="modal-crop-image" tabindex="-1" aria-labelledby="modal-crop-image-title" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary-subtle">
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-crop-image-title" style="font-size: 1.1rem;">
                <i class="mdi mdi-crop text-danger fs-4"></i>
                ${window.t('registrations.modal.crop_title') || "Recortar Foto"}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center p-3">
              <div class="position-relative d-inline-block border border-secondary-subtle bg-dark rounded-3 overflow-hidden shadow-sm mb-3" style="width: 320px; height: 320px; cursor: grab;">
                <canvas id="crop-canvas" width="320" height="320" class="d-block"></canvas>
              </div>
              <div class="mb-3 px-3">
                <label for="crop-zoom-slider" class="form-label small text-secondary fw-semibold d-flex align-items-center justify-content-between mb-1" style="font-size: 0.75rem;">
                  <span>Zoom</span>
                  <span id="zoom-value" class="text-body-emphasis">1.0x</span>
                </label>
                <input type="range" class="form-range" id="crop-zoom-slider" min="0.5" max="4" step="0.05" value="1">
              </div>
              <div class="small text-secondary px-2 mb-3" style="font-size: 0.7rem;">
                <i class="mdi mdi-information-outline"></i> ${window.t('registrations.modal.crop_help')}
              </div>
              
              <!-- Modal Actions inside Body for perfect visual cohesion -->
              <div class="d-flex justify-content-end gap-2 pt-2 px-1">
                <button type="button" class="btn btn-secondary px-3 py-2 fw-semibold btn-sm" data-bs-dismiss="modal">
                  ${window.t('registrations.modal.cancel_button')}
                </button>
                <button type="button" id="btn-apply-crop" class="btn btn-primary px-3 py-2 fw-semibold d-flex align-items-center gap-2 btn-sm">
                  <i class="mdi mdi-check"></i>
                  ${window.t('registrations.modal.crop_button') || "Aplicar Recorte"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('slotrace-registrations-drivers-create-modal', SlotRaceRegistrationsDriversCreateModal);
