class SlotRaceRegistrationsCarsCreateModal extends HTMLElement {
  connectedCallback() {
    this.editCarId = '';
    this.carPhotoBase64 = '';
    this.drivers = [];

    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
    };

    this._editRequestListener = (e) => {
      const { car } = e.detail;
      this.editCarId = car.id;

      this.loadDrivers().then(() => {
        // Populate fields
        const nameInput = this.querySelector('#input-car-name');
        const manufacturerInput = this.querySelector('#input-car-manufacturer');
        const scaleInput = this.querySelector('#input-car-scale');
        const ownerSelect = this.querySelector('#select-car-owner');
        const imgPreview = this.querySelector('#img-car-preview');
        const iconPlaceholder = this.querySelector('#icon-car-placeholder');

        if (nameInput) nameInput.value = car.name || '';
        if (manufacturerInput) manufacturerInput.value = car.manufacturer || car.brand || '';
        if (scaleInput) scaleInput.value = car.scale || '';
        if (ownerSelect) ownerSelect.value = car.ownerId || '';

        if (car.photo) {
          this.carPhotoBase64 = car.photo;
          if (imgPreview && iconPlaceholder) {
            imgPreview.src = car.photo;
            imgPreview.classList.remove('d-none');
            iconPlaceholder.classList.add('d-none');
          }
        } else {
          this.carPhotoBase64 = '';
          if (imgPreview && iconPlaceholder) {
            imgPreview.src = '';
            imgPreview.classList.add('d-none');
            iconPlaceholder.classList.remove('d-none');
          }
        }

        // Update modal title and save button text dynamically!
        const titleEl = this.querySelector('#modal-new-car-title');
        const submitBtnEl = this.querySelector('#btn-submit-car');

        if (titleEl) {
          titleEl.innerHTML = `<i class="mdi mdi-car-cog text-primary fs-4"></i> ${window.t('registrations.cars_modal.edit_car_title') || 'Edit Car'}`;
        }
        if (submitBtnEl) {
          submitBtnEl.innerHTML = `<i class="mdi mdi-content-save-outline fs-5"></i> ${window.t('registrations.cars_modal.save_changes_button') || 'Save Changes'}`;
        }

        this.show();
      });
    };

    this._createRequestListener = () => {
      this.loadDrivers().then(() => {
        this.show();
      });
    };

    window.addEventListener('languageChanged', this._langListener);
    window.addEventListener('requestEditCar', this._editRequestListener);
    window.addEventListener('requestCreateCar', this._createRequestListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._editRequestListener) {
      window.removeEventListener('requestEditCar', this._editRequestListener);
    }
    if (this._createRequestListener) {
      window.removeEventListener('requestCreateCar', this._createRequestListener);
    }
  }

  show() {
    const modalEl = this.querySelector('#modal-new-car');
    if (modalEl) {
      let modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalEl);
      }
      modalInstance.show();
    }
  }

  loadDrivers() {
    return window.electronAPI.db.get('drivers').then(drivers => {
      this.drivers = (drivers || []).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      this.populateOwnersDropdown();
    }).catch(err => {
      console.error('Failed to load drivers for cars owner dropdown:', err);
    });
  }

  populateOwnersDropdown() {
    const ownerSelect = this.querySelector('#select-car-owner');
    if (!ownerSelect) return;

    ownerSelect.innerHTML = '';

    // Add empty option
    const noOwnerOpt = document.createElement('option');
    noOwnerOpt.value = '';
    noOwnerOpt.textContent = window.t('registrations.cars_modal.no_owner') || '-- No Owner --';
    ownerSelect.appendChild(noOwnerOpt);

    // Add drivers
    if (this.drivers && this.drivers.length > 0) {
      this.drivers.forEach(driver => {
        const opt = document.createElement('option');
        opt.value = driver.id;
        const displayName = driver.nickname ? `${driver.name} (${driver.nickname})` : driver.name;
        opt.textContent = displayName;
        ownerSelect.appendChild(opt);
      });
    }
  }

  setupEvents() {
    const modalEl = this.querySelector('#modal-new-car');
    const form = this.querySelector('#form-new-car');
    const fileInput = this.querySelector('#input-car-photo');
    const imgPreview = this.querySelector('#img-car-preview');
    const iconPlaceholder = this.querySelector('#icon-car-placeholder');
    const cropModalEl = this.querySelector('#modal-crop-car-image');

    this.carPhotoBase64 = this.carPhotoBase64 || '';

    // Restore the main modal when the crop modal is closed to prevent double backdrops/overlap
    if (cropModalEl) {
      cropModalEl.addEventListener('hidden.bs.modal', () => {
        const mainModalEl = this.querySelector('#modal-new-car');
        if (mainModalEl) {
          let mainModalInstance = bootstrap.Modal.getInstance(mainModalEl);
          if (!mainModalInstance) {
            mainModalInstance = new bootstrap.Modal(mainModalEl);
          }
          mainModalInstance.show();
        }
      });
    }

    // Handle photo selection and crop modal triggers
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.initCropper(event.target.result);
            fileInput.value = ''; // Reset
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Handle form submit and Node db save
    if (form && modalEl) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }

        const nameInput = this.querySelector('#input-car-name');
        const manufacturerInput = this.querySelector('#input-car-manufacturer');
        const scaleInput = this.querySelector('#input-car-scale');
        const ownerSelect = this.querySelector('#select-car-owner');

        const nameVal = nameInput ? nameInput.value.trim() : '';
        const manufacturerVal = manufacturerInput ? manufacturerInput.value.trim() : '';
        const scaleVal = scaleInput ? scaleInput.value.trim() : '';
        const ownerIdVal = ownerSelect ? ownerSelect.value : '';

        window.electronAPI.db.get('cars').then(cars => {
          const carsList = cars || [];

          if (this.editCarId) {
            // Edit Mode
            const carIndex = carsList.findIndex(c => c.id === this.editCarId);
            if (carIndex !== -1) {
              carsList[carIndex].name = nameVal;
              carsList[carIndex].manufacturer = manufacturerVal;
              // Clean up older brand key if it exists
              delete carsList[carIndex].brand;
              carsList[carIndex].scale = scaleVal;
              carsList[carIndex].ownerId = ownerIdVal;
              carsList[carIndex].photo = this.carPhotoBase64 || '';
            }
          } else {
            // Create Mode
            const newCar = {
              id: Date.now().toString(),
              name: nameVal,
              manufacturer: manufacturerVal,
              scale: scaleVal,
              ownerId: ownerIdVal,
              photo: this.carPhotoBase64 || ''
            };
            carsList.push(newCar);
          }

          return window.electronAPI.db.set('cars', carsList);
        }).then(success => {
          if (success) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }
            window.dispatchEvent(new CustomEvent('carAdded'));
          }
        }).catch(err => {
          console.error('Failed to save car in database:', err);
        });
      });

      // Reset form and cache on modal hide
      modalEl.addEventListener('hidden.bs.modal', () => {
        form.reset();
        form.classList.remove('was-validated');
        this.carPhotoBase64 = '';
        this.editCarId = '';

        // Restore defaults (Create Mode)
        const titleEl = this.querySelector('#modal-new-car-title');
        const submitBtnEl = this.querySelector('#btn-submit-car');
        if (titleEl) {
          titleEl.innerHTML = `<i class="mdi mdi-car text-primary fs-4"></i> ${window.t('registrations.cars_modal.new_car_title') || 'New Car'}`;
        }
        if (submitBtnEl) {
          submitBtnEl.innerHTML = `<i class="mdi mdi-check-circle-outline fs-5"></i> ${window.t('registrations.cars_modal.save_button') || 'Save Car'}`;
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

      // Hide the main car creation modal temporarily to avoid overlapping backdrops!
      const mainModalEl = this.querySelector('#modal-new-car');
      if (mainModalEl) {
        const mainModalInstance = bootstrap.Modal.getInstance(mainModalEl);
        if (mainModalInstance) {
          mainModalInstance.hide();
        }
      }

      const cropModalEl = this.querySelector('#modal-crop-car-image');
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
    const canvas = this.querySelector('#crop-car-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const zoomSlider = this.querySelector('#crop-car-zoom-slider');
    const zoomValue = this.querySelector('#car-zoom-value');
    const applyBtn = this.querySelector('#btn-apply-car-crop');

    if (zoomSlider) zoomSlider.value = 1;
    if (zoomValue) zoomValue.textContent = '1.0x';

    const img = this.srcImage;
    
    // Expanded 460x300 canvas size parameters
    const canvasW = 460;
    const canvasH = 300;
    
    // Expanded 16:9 crop area aspect ratio parameters (almost entire width)
    const cropW = 420;
    const cropH = 236;
    const cropX = 20;
    const cropY = 32;
    const centerX = canvasW / 2; // 230
    const centerY = canvasH / 2; // 150

    // Minimum scale to cover the crop rectangle perfectly
    const scale = Math.max(cropW / img.width, cropH / img.height);
    const baseWidth = img.width * scale;
    const baseHeight = img.height * scale;

    // Center the image within the crop rectangle initially
    this.offsetX = cropX - (baseWidth - cropW) / 2;
    this.offsetY = cropY - (baseHeight - cropH) / 2;

    const draw = () => {
      ctx.clearRect(0, 0, canvasW, canvasH);
      const w = baseWidth * this.zoom;
      const h = baseHeight * this.zoom;

      // Auto-bound dragging offsets before rendering to ensure cover
      if (w >= cropW) {
        if (this.offsetX > cropX) this.offsetX = cropX;
        if (this.offsetX + w < cropX + cropW) this.offsetX = cropX + cropW - w;
      } else {
        this.offsetX = centerX - w / 2;
      }

      if (h >= cropH) {
        if (this.offsetY > cropY) this.offsetY = cropY;
        if (this.offsetY + h < cropY + cropH) this.offsetY = cropY + cropH - h;
      } else {
        this.offsetY = centerY - h / 2;
      }

      ctx.drawImage(img, this.offsetX, this.offsetY, w, h);

      ctx.save();
      // Draw dark semi-transparent mask outside crop area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      
      // Top overlay
      ctx.fillRect(0, 0, canvasW, cropY);
      // Bottom overlay
      ctx.fillRect(0, cropY + cropH, canvasW, canvasH - (cropY + cropH));
      // Left overlay
      ctx.fillRect(0, cropY, cropX, cropH);
      // Right overlay
      ctx.fillRect(cropX + cropW, cropY, canvasW - (cropX + cropW), cropH);

      // Red border outline
      ctx.strokeStyle = '#dc3545';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropX, cropY, cropW, cropH);
      ctx.restore();
    };

    draw();

    const onZoomChange = (e) => {
      const oldZoom = this.zoom;
      this.zoom = parseFloat(e.target.value);
      if (zoomValue) zoomValue.textContent = `${this.zoom.toFixed(1)}x`;

      const zoomRatio = this.zoom / oldZoom;
      // Zoom centered on the crop box center (230, 150)
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
        cropCanvas.height = 225; // Widescreen 16:9 ratio
        const cropCtx = cropCanvas.getContext('2d');

        cropCtx.fillStyle = '#09090b'; 
        cropCtx.fillRect(0, 0, 400, 225);

        // Precise mapping from crop box to output canvas
        const scaleX = 400 / cropW;
        const scaleY = 225 / cropH;

        const destX = (this.offsetX - cropX) * scaleX;
        const destY = (this.offsetY - cropY) * scaleY;
        const destW = baseWidth * this.zoom * scaleX;
        const destH = baseHeight * this.zoom * scaleY;

        cropCtx.drawImage(img, destX, destY, destW, destH);

        this.carPhotoBase64 = cropCanvas.toDataURL('image/jpeg', 0.85);

        const imgPreview = this.querySelector('#img-car-preview');
        const iconPlaceholder = this.querySelector('#icon-car-placeholder');
        if (imgPreview && iconPlaceholder) {
          imgPreview.src = this.carPhotoBase64;
          imgPreview.classList.remove('d-none');
          iconPlaceholder.classList.add('d-none');
        }

        const cropModalEl = this.querySelector('#modal-crop-car-image');
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
      <div class="modal fade" id="modal-new-car" tabindex="-1" aria-labelledby="modal-new-car-title" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary-subtle">
            
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-new-car-title">
                <i class="mdi mdi-car text-primary fs-4"></i>
                ${window.t('registrations.cars_modal.new_car_title') || 'New Car'}
              </h5>
            </div>
            
            <div class="modal-body">
              <form id="form-new-car" class="needs-validation" novalidate>
                
                <!-- Horizontal 16:9 Photo Picker -->
                <div class="mb-4 text-center">
                  <div class="d-inline-block position-relative">
                    <div class="rounded border border-secondary-subtle shadow-sm overflow-hidden d-flex align-items-center justify-content-center bg-body-secondary position-relative" style="width: 240px; height: 135px; border-width: 2px !important;">
                      <img id="img-car-preview" src="" class="d-none w-100 h-100 object-fit-cover">
                      <i id="icon-car-placeholder" class="mdi mdi-car-sports text-secondary-50" style="font-size: 64px; line-height: 1;"></i>
                    </div>
                    
                    <label for="input-car-photo" class="btn btn-sm btn-primary rounded-circle position-absolute p-0 d-flex align-items-center justify-content-center shadow-sm" style="width: 34px; height: 34px; cursor: pointer; border: 3px solid var(--bs-body-bg); bottom: -10px; right: -10px;" title="${window.t('registrations.cars_modal.photo_label') || 'Car Photo'}">
                      <i class="mdi mdi-camera fs-6"></i>
                    </label>
                  </div>
                  
                  <input type="file" id="input-car-photo" class="d-none" accept="image/*">
                  <div class="small text-secondary mt-3">${window.t('registrations.cars_modal.photo_help') || 'Select a landscape photo for the scale car.'}</div>
                </div>
                
                <!-- Model Name input -->
                <div class="mb-3">
                  <label for="input-car-name" class="form-label fw-semibold text-secondary small">${window.t('registrations.cars_modal.name_label') || 'Model Name'}</label>
                  <input type="text" class="form-control p-2" id="input-car-name" placeholder="${window.t('registrations.cars_modal.name_placeholder') || 'Enter model name'}" required>
                  <div class="invalid-feedback">${window.t('registrations.cars_modal.validation_name') || 'Please enter a valid car model name.'}</div>
                </div>
                
                <!-- Manufacturer and Scale inputs in a single row -->
                <div class="row mb-3">
                  <!-- Manufacturer input -->
                  <div class="col-6">
                    <label for="input-car-manufacturer" class="form-label fw-semibold text-secondary small">${window.t('registrations.cars_modal.manufacturer_label') || 'Manufacturer'}</label>
                    <input type="text" class="form-control p-2" id="input-car-manufacturer" placeholder="${window.t('registrations.cars_modal.manufacturer_placeholder') || 'Enter manufacturer'}">
                  </div>

                  <!-- Scale input -->
                  <div class="col-6">
                    <label for="input-car-scale" class="form-label fw-semibold text-secondary small">${window.t('registrations.cars_modal.scale_label') || 'Scale'}</label>
                    <input type="text" class="form-control p-2" id="input-car-scale" value="1:32" placeholder="${window.t('registrations.cars_modal.scale_placeholder') || 'Enter scale'}">
                  </div>
                </div>

                <!-- Owner select -->
                <div class="mb-4">
                  <label for="select-car-owner" class="form-label fw-semibold text-secondary small">${window.t('registrations.cars_modal.owner_label') || 'Owner'}</label>
                  <select class="form-select p-2" id="select-car-owner">
                    <!-- populated dynamically -->
                  </select>
                </div>
                
                <!-- Modal Actions -->
                <div class="d-flex justify-content-end gap-2 pt-3">
                  <button type="button" class="btn btn-secondary px-3 fw-semibold" data-bs-dismiss="modal">
                    ${window.t('registrations.cars_modal.cancel_button') || 'Cancel'}
                  </button>
                  <button type="submit" id="btn-submit-car" class="btn btn-primary px-3 fw-semibold d-flex align-items-center gap-2">
                    <i class="mdi mdi-content-save-outline fs-5"></i>
                    ${window.t('registrations.cars_modal.save_button') || 'Save Car'}
                  </button>
                </div>
                
              </form>
            </div>
            
          </div>
        </div>
      </div>

      <!-- Native Image Cropping Modal (16:9 Aspect Ratio) -->
      <div class="modal fade" id="modal-crop-car-image" tabindex="-1" aria-labelledby="modal-crop-car-image-title" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary-subtle">
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-crop-car-image-title" style="font-size: 1.1rem;">
                <i class="mdi mdi-crop text-primary fs-4"></i>
                ${window.t('registrations.cars_modal.crop_title') || 'Crop Car Photo'}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center p-3">
              <div class="position-relative d-inline-block border border-secondary-subtle bg-dark rounded-3 overflow-hidden shadow-sm mb-3" style="width: 460px; height: 300px; cursor: grab;">
                <canvas id="crop-car-canvas" width="460" height="300" class="d-block"></canvas>
              </div>
              <div class="mb-3 px-3">
                <label for="crop-car-zoom-slider" class="form-label small text-secondary fw-semibold d-flex align-items-center justify-content-between mb-1" style="font-size: 0.75rem;">
                  <span>Zoom</span>
                  <span id="car-zoom-value" class="text-body-emphasis">1.0x</span>
                </label>
                <input type="range" class="form-range" id="crop-car-zoom-slider" min="0.5" max="4" step="0.05" value="1">
              </div>
              <div class="small text-secondary px-2 mb-3" style="font-size: 0.7rem;">
                <i class="mdi mdi-information-outline"></i> ${window.t('registrations.cars_modal.crop_help') || 'Drag to pan and use the slider to zoom'}
              </div>
              
              <!-- Modal Actions -->
              <div class="d-flex justify-content-end gap-2 pt-2 px-1">
                <button type="button" class="btn btn-secondary px-3 py-2 fw-semibold btn-sm" data-bs-dismiss="modal">
                  ${window.t('registrations.cars_modal.cancel_button') || 'Cancel'}
                </button>
                <button type="button" id="btn-apply-car-crop" class="btn btn-primary px-3 py-2 fw-semibold d-flex align-items-center gap-2 btn-sm">
                  <i class="mdi mdi-check"></i>
                  ${window.t('registrations.cars_modal.crop_button') || 'Apply Crop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('slotrace-registrations-cars-create-modal', SlotRaceRegistrationsCarsCreateModal);
