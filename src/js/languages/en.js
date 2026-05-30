window.localeStrings = window.localeStrings || {};
window.localeStrings.en = {
  navbar: {
    dashboard: "Dashboard",
    registrations: "Registrations",
    settings: "Settings"
  },
  dashboard: {
    title: "SlotRace Control",
    subtitle: "Offline telemetry and race management panel for your slot car track.",
    alert_title: "Initial Setup Completed!",
    alert_desc: "This is your empty dashboard. The local environment is configured with Bootstrap 5 and is ready for race modules, real-time telemetry, and sensors."
  },
  registrations: {
    title: "Registrations",
    desc: "Manage pilots, cars, and tracks in your local offline database.",
    drivers: "Drivers",
    cars: "Cars",
    tracks: "Tracks",
    new_driver: "New Driver",
    new_car: "New Car",
    new_track: "New Track",
    no_drivers_listed: "No drivers registered yet.",
    modal: {
      new_driver_title: "New Driver",
      name_label: "Name",
      name_placeholder: "Enter full name",
      nickname_label: "Nickname",
      nickname_placeholder: "Enter nickname",
      photo_label: "Driver Photo",
      photo_help: "Select a profile photo for the racer.",
      save_button: "Save Driver",
      cancel_button: "Cancel",
      driver_caps_label: "DRIVER",
      laps_label: "Laps",
      best_laps_label: "Best Laps",
      best_laps_abbr: "B. Laps",
      edit_button: "Edit",
      delete_button: "Delete",
      no_nickname: "No nickname",
      delete_title: "Delete Driver",
      delete_confirm_prefix: "Are you sure you want to delete the driver ",
      delete_confirm_suffix: "? This action cannot be undone.",
      delete_button_confirm: "Delete",
      edit_driver_title: "Edit Driver",
      save_changes_button: "Save Changes"
    },
    drivers_registry: "Drivers Registry",
    drivers_desc: "Manage the racers registered locally in the system.",
    no_drivers: "No Drivers Registered",
    no_drivers_desc: "Drivers database and registration form will be implemented in future modules.",
    cars_registry: "Cars Registry",
    cars_desc: "Manage the scale cars (slot cars) registered in the system.",
    no_cars: "No Cars Registered",
    no_cars_desc: "Cars database and registration form will be implemented in future modules.",
    tracks_registry: "Tracks Registry",
    tracks_desc: "Manage your track layouts, lane counts, and track lengths.",
    no_tracks: "No Tracks Registered",
    no_tracks_desc: "Tracks database and layouts will be implemented in future modules."
  },
  settings: {
    title: "Settings",
    desc: "Configure your offline SlotRace system settings and connected hardware.",
    menu: {
      informations: "Informations",
      preferences: "Preferences",
      connections: "Connections"
    },
    informations: {
      local_name_label: "Local Name",
      local_name_placeholder: "e.g., Monza Slot Club, Garage Autorama",
      validation_error: "Please enter a valid local name.",
      save_button: "Save Location"
    },
    preferences: {
      color_label: "Main Color",
      color_help: "Click the box to select your custom brand color.",
      theme_label: "Theme",
      theme_help: "Select between Dark and Light mode.",
      theme_dark: "Dark",
      theme_light: "Light",
      theme_bootstrap_dark: "Bootstrap Dark",
      theme_bootstrap_light: "Bootstrap Light",
      theme_tailwind_dark: "Tailwind Dark",
      theme_tailwind_light: "Tailwind Light",
      language_label: "Language",
      language_help: "Select your preferred application language.",
      save_button: "Save Preferences"
    },
    feedback: {
      saved: "Saved!"
    }
  }
};
