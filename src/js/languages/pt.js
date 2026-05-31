window.localeStrings = window.localeStrings || {};
window.localeStrings.pt = {
  navbar: {
    dashboard: "Painel",
    registrations: "Cadastros",
    settings: "Configurações"
  },
  dashboard: {
    title: "SlotRace Control",
    subtitle: "Painel offline de telemetria e gerenciamento de corridas para sua pista de autorama.",
    alert_title: "Configuração Inicial Concluída!",
    alert_desc: "Este é o seu painel de controle vazio. O ambiente local está configurado com Bootstrap 5 e pronto para receber módulos de corrida, telemetria em tempo real e sensores."
  },
  registrations: {
    title: "Cadastros",
    desc: "Gerencie pilotos, carros e pistas em seu banco de dados local offline.",
    drivers: "Pilotos",
    cars: "Carros",
    tracks: "Pistas",
    new_driver: "Novo Piloto",
    new_car: "Novo Carro",
    new_track: "Nova Pista",
    no_drivers_listed: "Nenhum piloto cadastrado ainda.",
    search_placeholder: "Pesquisar piloto...",
    no_drivers_found: "Nenhum piloto encontrado para esta pesquisa.",
    modal: {
      new_driver_title: "Novo Piloto",
      name_label: "Nome",
      name_placeholder: "Insira o nome completo",
      nickname_label: "Apelido",
      nickname_placeholder: "Insira o apelido",
      photo_label: "Foto do Piloto",
      photo_help: "Selecione uma foto de perfil para o piloto.",
      save_button: "Salvar Piloto",
      cancel_button: "Cancelar",
      driver_caps_label: "PILOTO",
      laps_label: "Voltas",
      best_laps_label: "Melhores Voltas",
      best_laps_abbr: "M. Voltas",
      edit_button: "Editar",
      delete_button: "Excluir",
      no_nickname: "Sem apelido",
      delete_title: "Excluir Piloto",
      delete_confirm_prefix: "Deseja realmente excluir o piloto ",
      delete_confirm_suffix: "? Esta ação não poderá ser desfeita.",
      delete_button_confirm: "Excluir",
      edit_driver_title: "Editar Piloto",
      save_changes_button: "Salvar Alterações",
      crop_title: "Recortar Foto do Piloto",
      crop_help: "Arraste a imagem para mover e use o controle deslizante para ampliar",
      crop_button: "Aplicar Recorte"
    },
    drivers_registry: "Cadastro de Pilotos",
    drivers_desc: "Gerencie os pilotos cadastrados localmente no sistema.",
    no_drivers: "Nenhum Piloto Cadastrado",
    no_drivers_desc: "O banco de dados e o formulário de cadastro de pilotos serão implementados em módulos futuros.",
    cars_registry: "Cadastro de Carros",
    cars_desc: "Gerencie os carros de escala (slot cars) cadastrados no sistema.",
    no_cars: "Nenhum Carro Cadastrado",
    no_cars_desc: "O banco de dados e o formulário de cadastro de carros serão implementados em módulos futuros.",
    no_cars_listed: "Nenhum carro cadastrado ainda.",
    search_car_placeholder: "Pesquisar carro...",
    no_cars_found: "Nenhum carro encontrado para esta pesquisa.",
    cars_modal: {
      new_car_title: "Novo Carro",
      edit_car_title: "Editar Carro",
      name_label: "Nome do Modelo",
      name_placeholder: "ex: Porsche 911 GT3, McLaren Senna",
      manufacturer_label: "Fabricante",
      manufacturer_placeholder: "ex: Scalextric, Carrera, Slot.it",
      scale_label: "Escala",
      scale_placeholder: "ex: 1:32, 1:24",
      owner_label: "Proprietário",
      owner_placeholder: "Selecione o proprietário",
      no_owner: "Sem proprietário",
      photo_label: "Foto do Carro",
      photo_help: "Selecione uma foto horizontal para o carro de escala.",
      save_button: "Salvar Carro",
      save_changes_button: "Salvar Alterações",
      cancel_button: "Cancelar",
      car_caps_label: "CARRO",
      edit_button: "Editar",
      delete_button: "Excluir",
      delete_title: "Excluir Carro",
      delete_confirm_prefix: "Deseja realmente excluir o carro ",
      delete_confirm_suffix: "? Esta ação não poderá ser desfeita.",
      delete_button_confirm: "Excluir",
      crop_title: "Recortar Foto do Carro",
      crop_help: "Arraste a imagem para mover e use o controle deslizante para ampliar",
      crop_button: "Aplicar Recorte"
    },
    tracks_registry: "Cadastro de Pistas",
    tracks_desc: "Gerencie os layouts das suas pistas, número de fendas e extensões.",
    no_tracks: "Nenhuma Pista Cadastrada",
    no_tracks_desc: "O banco de dados e os layouts das pistas serão implementados em módulos futuros."
  },
  settings: {
    title: "Configurações",
    desc: "Configure as definições do seu sistema SlotRace offline e hardware conectado.",
    menu: {
      informations: "Informações",
      preferences: "Preferências",
      connections: "Conexões"
    },
    informations: {
      local_name_label: "Nome do Local",
      local_name_placeholder: "ex: Monza Slot Club, Garage Autorama",
      validation_error: "Por favor, insira um nome de local válido.",
      save_button: "Salvar Localização"
    },
    preferences: {
      color_label: "Cor Principal",
      color_help: "Clique na caixa para selecionar sua cor de marca personalizada.",
      theme_label: "Tema",
      theme_help: "Selecione entre o modo Claro e Escuro.",
      theme_dark: "Escuro",
      theme_light: "Claro",
      theme_bootstrap_dark: "Bootstrap Escuro",
      theme_bootstrap_light: "Bootstrap Claro",
      theme_tailwind_dark: "Tailwind Escuro",
      theme_tailwind_light: "Tailwind Claro",
      language_label: "Idioma",
      language_help: "Selecione o idioma de sua preferência para a aplicação.",
      save_button: "Salvar Preferências"
    },
    feedback: {
      saved: "Salvo!"
    }
  },
  footer: {
    developed_by: "Desenvolvido por"
  }
};
