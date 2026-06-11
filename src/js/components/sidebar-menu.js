class SlotRaceSidebarMenu extends HTMLElement {
  connectedCallback() {
    this.render();

    this._langListener = () => this.render();
    window.addEventListener("languageChanged", this._langListener);

    this._routeListener = () => this.updateActiveState();
    window.addEventListener("hashchange", this._routeListener);
  }

  disconnectedCallback() {
    if (this._langListener) {
      window.removeEventListener("languageChanged", this._langListener);
    }
    if (this._routeListener) {
      window.removeEventListener("hashchange", this._routeListener);
    }
  }

  menu = [
    {
      name: "navbar.dashboard",
      icon: "mdi mdi-view-dashboard-outline",
      route: "#dashboard",
    },
    {
      name: "navbar.registrations",
      icon: "mdi mdi-clipboard-text-outline",
      route: "#registrations",
    },
    {
      name: "navbar.settings",
      icon: "mdi mdi-cog-outline",
      route: "#settings",
    },
  ];

  render() {
    this.innerHTML = `
    <div class="d-flex flex-column gap-2">
      ${this.menu
        .map(
          (item) => `
            <a 
              class="btn text-primary d-flex align-items-center gap-2 py-2 px-3 fw-medium"
              data-route="${item.route}"
              href="${item.route}"
            >
              <i class="${item.icon} fs-5"></i>
              <span>${window.t(item.name)}</span>
            </a>
          `,
        )
        .join("")}
    </div>
  `;

    this.updateActiveState();
  }

  updateActiveState() {
    const currentRoute = window.location.hash.split("?")[0];

    this.querySelectorAll("a[data-route]").forEach((element) => {
      const route = element.dataset.route;

      const isActive =
        currentRoute === route || currentRoute.startsWith(`${route}/`);

      element.classList.toggle("btn-primary", isActive);
      element.classList.toggle("text-primary", !isActive);
    });
  }
}

customElements.define("slotrace-sidebar-menu", SlotRaceSidebarMenu);
