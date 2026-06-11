class SlotRaceSearchInput extends HTMLElement {
  static get observedAttributes() {
    return ["placeholder-key", "filter-event", "debounce-ms"];
  }

  connectedCallback() {
    this._value = "";
    this.render();
    this.setupEvents();

    this._langListener = () => {
      this.render();
      this.setupEvents();
      const input = this.querySelector("input");
      if (input) {
        input.value = this._value;
      }
    };
    window.addEventListener("languageChanged", this._langListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      this.setupEvents();
    }
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val || "";
    const input = this.querySelector("input");
    if (input) {
      input.value = this._value;
    }
  }

  render() {
    const placeholderKey = this.getAttribute("placeholder-key") || "registrations.search_placeholder";
    const placeholder = window.t(placeholderKey) || "Pesquisar...";

    this.innerHTML = `
      <div class="d-flex align-items-center form-control search-wrapper-cardless border border-secondary-subtle rounded" style="max-width: 300px; width: 100%;">
        <span class="bg-transparent border-0 pe-1 ps-1">
          <i class="mdi mdi-magnify fs-5"></i>
        </span>
        <input type="text" class="form-control bg-transparent border-0 text-body-emphasis ps-1 pe-3 py-2 flex-grow-1" placeholder="${placeholder}" style="outline: none; box-shadow: none; border: 0px !important;">
      </div>
    `;
  }

  setupEvents() {
    const input = this.querySelector("input");
    const filterEvent = this.getAttribute("filter-event");
    const debounceMs = parseInt(this.getAttribute("debounce-ms"), 10) || 1000;

    if (input && filterEvent) {
      let debounceTimeout;
      input.addEventListener("input", (e) => {
        this._value = e.target.value;
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent(filterEvent, {
              detail: { query: e.target.value },
            }),
          );
        }, debounceMs);
      });
    }
  }
}

customElements.define("slotrace-search-input", SlotRaceSearchInput);
