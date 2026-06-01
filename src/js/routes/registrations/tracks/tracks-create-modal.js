class SlotRaceRegistrationsTracksCreateModal extends HTMLElement {
  connectedCallback() {
    this.editTrackId = '';
    this.trackPhotoBase64 = '';
    this.editTrackRecordTime = '';
    this.editTrackRecordPilotId = '';

    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
    };

    this._editRequestListener = (e) => {
      const { track } = e.detail;
      this.editTrackId = track.id;
      this.editTrackRecordTime = track.recordTime || '';
      this.editTrackRecordPilotId = track.recordPilotId || '';

      // Populate fields
      const nameInput = this.querySelector('#input-track-name');
      const scaleInput = this.querySelector('#input-track-scale');
      const lanesInput = this.querySelector('#input-track-lanes');
      const lengthInput = this.querySelector('#input-track-length');
      const powerbarsInput = this.querySelector('#input-track-powerbars');
      
      const imgPreview = this.querySelector('#img-track-preview');
      const iconPlaceholder = this.querySelector('#icon-track-placeholder');

      if (nameInput) nameInput.value = track.name || '';
      if (scaleInput) scaleInput.value = track.scale || '';
      if (lanesInput) {
        lanesInput.value = track.lanes || '';
        this.generateLaneColorInputs(track.lanes, track.laneColors || []);
      }
      if (lengthInput) lengthInput.value = track.length || '';
      if (powerbarsInput) powerbarsInput.value = track.powerbars || '';

      if (track.photo) {
        this.trackPhotoBase64 = track.photo;
        if (imgPreview && iconPlaceholder) {
          imgPreview.src = track.photo;
          imgPreview.classList.remove('d-none');
          iconPlaceholder.classList.add('d-none');
        }
      } else {
        this.trackPhotoBase64 = '';
        if (imgPreview && iconPlaceholder) {
          imgPreview.src = '';
          imgPreview.classList.add('d-none');
          iconPlaceholder.classList.remove('d-none');
        }
      }

      // Update modal title and save button text dynamically!
      const titleEl = this.querySelector('#modal-new-track-title');
      const submitBtnEl = this.querySelector('#btn-submit-track');

      if (titleEl) {
        titleEl.innerHTML = `<i class="mdi mdi-flag-checkered text-primary fs-4"></i> ${window.t('registrations.tracks_modal.edit_track_title') || 'Edit Track'}`;
      }
      if (submitBtnEl) {
        submitBtnEl.innerHTML = `<i class="mdi mdi-content-save-outline fs-5"></i> ${window.t('registrations.tracks_modal.save_changes_button') || 'Save Changes'}`;
      }

      this.show();
    };

    this._createRequestListener = () => {
      this.editTrackRecordTime = '';
      this.editTrackRecordPilotId = '';
      this.show();
    };

    window.addEventListener('languageChanged', this._langListener);
    window.addEventListener('requestEditTrack', this._editRequestListener);
    window.addEventListener('requestCreateTrack', this._createRequestListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener('languageChanged', this._langListener);
    }
    if (this._editRequestListener) {
      window.removeEventListener('requestEditTrack', this._editRequestListener);
    }
    if (this._createRequestListener) {
      window.removeEventListener('requestCreateTrack', this._createRequestListener);
    }
  }

  show() {
    const modalEl = this.querySelector('#modal-new-track');
    if (modalEl) {
      let modalInstance = bootstrap.Modal.getInstance(modalEl);
      if (!modalInstance) {
        modalInstance = new bootstrap.Modal(modalEl);
      }
      modalInstance.show();
    }
  }

  setupEvents() {
    const modalEl = this.querySelector('#modal-new-track');
    const form = this.querySelector('#form-new-track');
    const fileInput = this.querySelector('#input-track-photo');
    const imgPreview = this.querySelector('#img-track-preview');
    const iconPlaceholder = this.querySelector('#icon-track-placeholder');
    const cropModalEl = this.querySelector('#modal-crop-track-image');

    this.trackPhotoBase64 = this.trackPhotoBase64 || '';

    // Restore the main modal when the crop modal is closed to prevent double backdrops/overlap
    if (cropModalEl) {
      cropModalEl.addEventListener('hidden.bs.modal', () => {
        const mainModalEl = this.querySelector('#modal-new-track');
        if (mainModalEl) {
          let mainModalInstance = bootstrap.Modal.getInstance(mainModalEl);
          if (!mainModalInstance) {
            mainModalInstance = new bootstrap.Modal(mainModalEl);
          }
          mainModalInstance.show();
        }
      });
    }

    // Handle lanes input changes to dynamically render color pickers
    const lanesInput = this.querySelector('#input-track-lanes');
    if (lanesInput) {
      lanesInput.addEventListener('input', (e) => {
        const count = parseInt(e.target.value) || 0;
        const currentColors = [];
        const container = this.querySelector('#lanes-colors-container');
        if (container) {
          const rows = container.querySelectorAll('.lane-color-row');
          rows.forEach(row => {
            const num = parseInt(row.getAttribute('data-lane-number'));
            const colorInput = row.querySelector('input[type="color"]');
            if (colorInput) {
              currentColors.push({
                number: num,
                color: colorInput.value
              });
            }
          });
        }
        this.generateLaneColorInputs(count, currentColors);
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

        const nameInput = this.querySelector('#input-track-name');
        const scaleInput = this.querySelector('#input-track-scale');
        const lanesInput = this.querySelector('#input-track-lanes');
        const lengthInput = this.querySelector('#input-track-length');
        const powerbarsInput = this.querySelector('#input-track-powerbars');

        const nameVal = nameInput ? nameInput.value.trim() : '';
        const scaleVal = scaleInput ? scaleInput.value.trim() : '';
        const lanesVal = lanesInput ? lanesInput.value.trim() : '';
        const lengthVal = lengthInput ? lengthInput.value.trim() : '';
        const powerbarsVal = powerbarsInput ? powerbarsInput.value.trim() : '';

        // Collect lane colors with order objects
        const laneColors = [];
        const colorsContainer = this.querySelector('#lanes-colors-container');
        if (colorsContainer) {
          const rows = colorsContainer.querySelectorAll('.lane-color-row');
          rows.forEach(row => {
            const num = parseInt(row.getAttribute('data-lane-number'));
            const colorInput = row.querySelector('input[type="color"]');
            if (colorInput) {
              laneColors.push({
                number: num,
                color: colorInput.value
              });
            }
          });
        }

        window.electronAPI.db.get('tracks').then(tracks => {
          const tracksList = tracks || [];

          if (this.editTrackId) {
            // Edit Mode
            const trackIndex = tracksList.findIndex(t => t.id === this.editTrackId);
            if (trackIndex !== -1) {
              tracksList[trackIndex].name = nameVal;
              tracksList[trackIndex].scale = scaleVal;
              tracksList[trackIndex].lanes = lanesVal;
              tracksList[trackIndex].length = lengthVal;
              tracksList[trackIndex].powerbars = powerbarsVal;
              tracksList[trackIndex].photo = this.trackPhotoBase64 || '';
              tracksList[trackIndex].laneColors = laneColors;
              // Keep original record fields untouched
              tracksList[trackIndex].recordTime = this.editTrackRecordTime;
              tracksList[trackIndex].recordPilotId = this.editTrackRecordPilotId;
            }
          } else {
            // Create Mode
            const newTrack = {
              id: Date.now().toString(),
              name: nameVal,
              scale: scaleVal,
              lanes: lanesVal,
              length: lengthVal,
              powerbars: powerbarsVal,
              recordTime: '',
              recordPilotId: '',
              photo: this.trackPhotoBase64 || '',
              laneColors: laneColors
            };
            tracksList.push(newTrack);
          }

          return window.electronAPI.db.set('tracks', tracksList);
        }).then(success => {
          if (success) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) {
              modalInstance.hide();
            }
            window.dispatchEvent(new CustomEvent('trackAdded'));
          }
        }).catch(err => {
          console.error('Failed to save track in database:', err);
        });
      });

      // Reset form and cache on modal hide
      modalEl.addEventListener('hidden.bs.modal', () => {
        form.reset();
        form.classList.remove('was-validated');
        this.trackPhotoBase64 = '';
        this.editTrackId = '';
        this.editTrackRecordTime = '';
        this.editTrackRecordPilotId = '';

        // Restore defaults (Create Mode)
        const titleEl = this.querySelector('#modal-new-track-title');
        const submitBtnEl = this.querySelector('#btn-submit-track');
        if (titleEl) {
          titleEl.innerHTML = `<i class="mdi mdi-flag-checkered text-primary fs-4"></i> ${window.t('registrations.tracks_modal.new_track_title') || 'New Track'}`;
        }
        if (submitBtnEl) {
          submitBtnEl.innerHTML = `<i class="mdi mdi-check-circle-outline fs-5"></i> ${window.t('registrations.tracks_modal.save_button') || 'Save Track'}`;
        }

        if (imgPreview && iconPlaceholder) {
          imgPreview.src = '';
          imgPreview.classList.add('d-none');
          iconPlaceholder.classList.remove('d-none');
        }

        // Clean dynamic lanes container
        const container = this.querySelector('#lanes-colors-container');
        if (container) container.innerHTML = '';
      });
    }
  }

  generateLaneColorInputs(count, existingColors = []) {
    const container = this.querySelector('#lanes-colors-container');
    if (!container) return;

    container.innerHTML = '';
    const num = parseInt(count) || 0;
    if (num <= 0) return;

    const defaultColors = [
      '#dc3545', // Red
      '#0d6efd', // Blue
      '#ffffff', // White
      '#ffc107', // Yellow
      '#198754', // Green
      '#fd7e14', // Orange
      '#6f42c1', // Purple
      '#0dcaf0'  // Cyan
    ];

    const laneWord = window.localeStrings[window.currentLanguage]?.registrations?.tracks_modal?.lane_label || 
                     (window.currentLanguage === 'pt' ? 'Fenda' : (window.currentLanguage === 'es' ? 'Carril' : 'Lane'));

    // Normalize existingColors to array of objects
    let normalized = existingColors.map((item, idx) => {
      if (item && typeof item === 'object') return item;
      return { number: idx + 1, color: item || defaultColors[idx % defaultColors.length] };
    });

    // If count increased, pad with new items
    if (normalized.length < num) {
      let maxNum = 0;
      normalized.forEach(item => {
        if (item.number > maxNum) maxNum = item.number;
      });
      
      const needed = num - normalized.length;
      for (let k = 0; k < needed; k++) {
        const nextNumber = maxNum + k + 1;
        const colorValue = defaultColors[(nextNumber - 1) % defaultColors.length];
        normalized.push({ number: nextNumber, color: colorValue });
      }
    } else if (normalized.length > num) {
      normalized = normalized.slice(0, num);
    }

    normalized.forEach(item => {
      const number = item.number;
      const colorValue = item.color;

      const row = document.createElement('div');
      row.className = 'lane-color-row d-flex align-items-center justify-content-between py-1.5';
      row.setAttribute('data-lane-number', number);
      row.setAttribute('draggable', 'false');
      
      row.innerHTML = `
        <div class="d-flex align-items-center gap-2">
          <!-- Drag handle icon -->
          <i class="mdi mdi-drag-vertical text-secondary drag-handle" style="cursor: move; font-size: 1.25rem;" title="Drag to reorder"></i>
          
          <label class="fw-semibold small mb-0" style="color: ${colorValue} !important; transition: color 0.15s ease;">
            ${laneWord} ${number}
          </label>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="small fw-semibold text-uppercase font-monospace me-1" style="font-size: 0.8rem; color: ${colorValue} !important; transition: color 0.15s ease;">${colorValue}</span>
          
          <!-- Custom 2-line color picker swatch representing guide rail/braids -->
          <div class="custom-color-swatch position-relative d-flex align-items-center justify-content-center border border-secondary-subtle" style="width: 44px; height: 32px; background-color: #1a1a1a; border-radius: 6px; cursor: pointer;">
            <span class="lane-line" style="width: 3px; height: 18px; background-color: ${colorValue}; margin-right: 3px; border-radius: 1px; transition: background-color 0.15s ease;"></span>
            <span class="lane-line" style="width: 3px; height: 18px; background-color: ${colorValue}; border-radius: 1px; transition: background-color 0.15s ease;"></span>
            <input type="color" class="position-absolute top-0 start-0 w-100 h-100 opacity-0" style="cursor: pointer;" value="${colorValue}">
          </div>
        </div>
      `;

      const colorInput = row.querySelector('input[type="color"]');
      const labelElement = row.querySelector('label');
      const textPreview = row.querySelector('span');
      const laneLines = row.querySelectorAll('.lane-line');
      
      if (colorInput && labelElement && textPreview) {
        colorInput.addEventListener('input', (e) => {
          const newColor = e.target.value;
          textPreview.textContent = newColor.toUpperCase();
          textPreview.style.setProperty('color', newColor, 'important');
          labelElement.style.setProperty('color', newColor, 'important');
          
          laneLines.forEach(line => {
            line.style.backgroundColor = newColor;
          });
        });
      }

      this.setupDragAndDrop(row);
      container.appendChild(row);
    });
  }

  setupDragAndDrop(row) {
    const handle = row.querySelector('.drag-handle');
    if (handle) {
      handle.addEventListener('mousedown', () => {
        row.setAttribute('draggable', 'true');
      });
      handle.addEventListener('mouseup', () => {
        row.setAttribute('draggable', 'false');
      });
      handle.addEventListener('mouseleave', () => {
        row.setAttribute('draggable', 'false');
      });
    }

    row.addEventListener('dragstart', (e) => {
      row.classList.add('opacity-50');
      this._draggedRow = row;
      e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('opacity-50');
      row.setAttribute('draggable', 'false');
      this._draggedRow = null;
    });

    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (!this._draggedRow || this._draggedRow === row) return;

      const container = this.querySelector('#lanes-colors-container');
      const children = Array.from(container.children);
      const draggedIndex = children.indexOf(this._draggedRow);
      const targetIndex = children.indexOf(row);

      if (draggedIndex < targetIndex) {
        container.insertBefore(this._draggedRow, row.nextSibling);
      } else {
        container.insertBefore(this._draggedRow, row);
      }
    });
  }

  initCropper(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      this.srcImage = img;
      this.zoom = 1;
      this.offsetX = 0;
      this.offsetY = 0;

      // Hide the main track creation modal temporarily to avoid overlapping backdrops!
      const mainModalEl = this.querySelector('#modal-new-track');
      if (mainModalEl) {
        const mainModalInstance = bootstrap.Modal.getInstance(mainModalEl);
        if (mainModalInstance) {
          mainModalInstance.hide();
        }
      }

      const cropModalEl = this.querySelector('#modal-crop-track-image');
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
    const canvas = this.querySelector('#crop-track-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const zoomSlider = this.querySelector('#crop-track-zoom-slider');
    const zoomValue = this.querySelector('#track-zoom-value');
    const applyBtn = this.querySelector('#btn-apply-track-crop');

    if (zoomSlider) zoomSlider.value = 1;
    if (zoomValue) zoomValue.textContent = '1.0x';

    const img = this.srcImage;
    
    // Expanded 460x300 canvas size parameters
    const canvasW = 460;
    const canvasH = 300;
    
    // Expanded 16:9 crop area aspect ratio parameters
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

        this.trackPhotoBase64 = cropCanvas.toDataURL('image/jpeg', 0.85);

        const imgPreview = this.querySelector('#img-track-preview');
        const iconPlaceholder = this.querySelector('#icon-track-placeholder');
        if (imgPreview && iconPlaceholder) {
          imgPreview.src = this.trackPhotoBase64;
          imgPreview.classList.remove('d-none');
          iconPlaceholder.classList.add('d-none');
        }

        const cropModalEl = this.querySelector('#modal-crop-track-image');
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
      <div class="modal fade" id="modal-new-track" tabindex="-1" aria-labelledby="modal-new-track-title" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary-subtle">
            
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-new-track-title">
                <i class="mdi mdi-flag-checkered text-primary fs-4"></i>
                ${window.t('registrations.tracks_modal.new_track_title') || 'New Track'}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <div class="modal-body">
              <form id="form-new-track" class="needs-validation" novalidate>
                
                <!-- Horizontal 16:9 Photo Picker -->
                <div class="mb-4 text-center">
                  <div class="d-inline-block position-relative">
                    <div class="rounded border border-secondary-subtle shadow-sm overflow-hidden d-flex align-items-center justify-content-center bg-body-secondary position-relative" style="width: 240px; height: 135px; border-width: 2px !important;">
                      <img id="img-track-preview" src="" class="d-none w-100 h-100 object-fit-cover">
                      <i id="icon-track-placeholder" class="mdi mdi-flag-checkered text-secondary-50" style="font-size: 64px; line-height: 1;"></i>
                    </div>
                    
                    <label for="input-track-photo" class="btn btn-sm btn-primary rounded-circle position-absolute p-0 d-flex align-items-center justify-content-center shadow-sm" style="width: 34px; height: 34px; cursor: pointer; border: 3px solid var(--bs-body-bg); bottom: -10px; right: -10px;" title="${window.t('registrations.tracks_modal.photo_label') || 'Track Photo'}">
                      <i class="mdi mdi-camera fs-6"></i>
                    </label>
                  </div>
                  
                  <input type="file" id="input-track-photo" class="d-none" accept="image/*">
                  <div class="small text-secondary mt-3">${window.t('registrations.tracks_modal.photo_help') || 'Select a landscape photo for the track layout.'}</div>
                </div>
                
                <!-- Track Name input -->
                <div class="mb-3">
                  <label for="input-track-name" class="form-label fw-semibold text-secondary small">${window.t('registrations.tracks_modal.name_label') || 'Track Name'}</label>
                  <input type="text" class="form-control p-2" id="input-track-name" placeholder="${window.t('registrations.tracks_modal.name_placeholder') || 'Enter track name'}" required>
                  <div class="invalid-feedback">${window.t('registrations.tracks_modal.validation_name') || 'Please enter a valid track name.'}</div>
                </div>
                
                <!-- Lanes and Scale row -->
                <div class="row mb-3">
                  <!-- Lanes input -->
                  <div class="col-6">
                    <label for="input-track-lanes" class="form-label fw-semibold text-secondary small">${window.t('registrations.tracks_modal.lanes_label') || 'Lanes'}</label>
                    <input type="number" min="1" step="1" class="form-control p-2" id="input-track-lanes" placeholder="${window.t('registrations.tracks_modal.lanes_placeholder') || 'Enter lanes'}" required>
                    <div class="invalid-feedback">${window.t('registrations.tracks_modal.validation_lanes') || 'Please enter a valid lane count.'}</div>
                  </div>

                  <!-- Scale input -->
                  <div class="col-6">
                    <label for="input-track-scale" class="form-label fw-semibold text-secondary small">${window.t('registrations.tracks_modal.scale_label') || 'Scale'}</label>
                    <input type="text" class="form-control p-2" id="input-track-scale" value="1:32" placeholder="${window.t('registrations.tracks_modal.scale_placeholder') || 'Enter scale'}">
                  </div>
                </div>

                <!-- Lanes colors container -->
                <div id="lanes-colors-container" class="mb-3"></div>

                <!-- Length and Powerbars row -->
                <div class="row mb-4">
                  <!-- Length input -->
                  <div class="col-6">
                    <label for="input-track-length" class="form-label fw-semibold text-secondary small">${window.t('registrations.tracks_modal.length_label') || 'Length (meters)'}</label>
                    <input type="number" min="0.1" step="0.01" class="form-control p-2" id="input-track-length" placeholder="${window.t('registrations.tracks_modal.length_placeholder') || 'Enter length'}">
                  </div>

                  <!-- Powerbars input -->
                  <div class="col-6">
                    <label for="input-track-powerbars" class="form-label fw-semibold text-secondary small">${window.t('registrations.tracks_modal.powerbars_label') || 'Powerbars'}</label>
                    <input type="number" min="0" step="1" class="form-control p-2" id="input-track-powerbars" placeholder="${window.t('registrations.tracks_modal.powerbars_placeholder') || 'Enter powerbars'}">
                  </div>
                </div>
                
                <!-- Modal Actions -->
                <div class="d-flex justify-content-end gap-2 pt-3">
                  <button type="button" class="btn btn-secondary px-3 fw-semibold" data-bs-dismiss="modal">
                    ${window.t('registrations.tracks_modal.cancel_button') || 'Cancel'}
                  </button>
                  <button type="submit" id="btn-submit-track" class="btn btn-primary px-3 fw-semibold d-flex align-items-center gap-2">
                    <i class="mdi mdi-content-save-outline fs-5"></i>
                    ${window.t('registrations.tracks_modal.save_button') || 'Save Track'}
                  </button>
                </div>
                
              </form>
            </div>
            
          </div>
        </div>
      </div>

      <!-- Native Image Cropping Modal (16:9 Aspect Ratio) -->
      <div class="modal fade" id="modal-crop-track-image" tabindex="-1" aria-labelledby="modal-crop-track-image-title" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-secondary-subtle">
            <div class="modal-header border-secondary-subtle bg-body-tertiary">
              <h5 class="modal-title fw-bold text-body-emphasis d-flex align-items-center gap-2" id="modal-crop-track-image-title" style="font-size: 1.1rem;">
                <i class="mdi mdi-crop text-primary fs-4"></i>
                ${window.t('registrations.tracks_modal.crop_title') || 'Crop Track Photo'}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-center p-3">
              <div class="position-relative d-inline-block border border-secondary-subtle bg-dark rounded-3 overflow-hidden shadow-sm mb-3" style="width: 460px; height: 300px; cursor: grab;">
                <canvas id="crop-track-canvas" width="460" height="300" class="d-block"></canvas>
              </div>
              <div class="mb-3 px-3">
                <label for="crop-track-zoom-slider" class="form-label small text-secondary fw-semibold d-flex align-items-center justify-content-between mb-1" style="font-size: 0.75rem;">
                  <span>Zoom</span>
                  <span id="track-zoom-value" class="text-body-emphasis">1.0x</span>
                </label>
                <input type="range" class="form-range" id="crop-track-zoom-slider" min="0.5" max="4" step="0.05" value="1">
              </div>
              <div class="small text-secondary px-2 mb-3" style="font-size: 0.7rem;">
                <i class="mdi mdi-information-outline"></i> ${window.t('registrations.tracks_modal.crop_help') || 'Drag to pan and use the slider to zoom'}
              </div>
              
              <!-- Modal Actions -->
              <div class="d-flex justify-content-end gap-2 pt-2 px-1">
                <button type="button" class="btn btn-secondary px-3 py-2 fw-semibold btn-sm" data-bs-dismiss="modal">
                  ${window.t('registrations.tracks_modal.cancel_button') || 'Cancel'}
                </button>
                <button type="button" id="btn-apply-track-crop" class="btn btn-primary px-3 py-2 fw-semibold d-flex align-items-center gap-2 btn-sm">
                  <i class="mdi mdi-check"></i>
                  ${window.t('registrations.tracks_modal.crop_button') || 'Apply Crop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('slotrace-registrations-tracks-create-modal', SlotRaceRegistrationsTracksCreateModal);
