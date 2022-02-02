const ManagementService = require("../../domain/managementService");

class MainEngine {
  #io;
  #logger;
  #managementService;

  constructor(io, logger) {
    this.#io = io;
    this.#logger = logger;
    this.#managementService = new ManagementService(logger);
  }

  #setEventHandlers() {
    const stateScope = this;

    // listen socket
    this.#io.on("connection", (socket) => {
      stateScope.#managementService.connect(socket);

      socket.on("identify", (data) => stateScope.#managementService.identify(socket.id, data));
      socket.on("games", (data) => stateScope.#managementService.games(socket.id, data));
      socket.on("players", (data) => stateScope.#managementService.players(socket.id, data));
      socket.on("host", (data) => stateScope.#managementService.host(socket.id, data));
      socket.on("join", (data) => stateScope.#managementService.join(socket.id, data));
      socket.on("add bot", (data) => stateScope.#managementService.addBot(socket.id, data));
      socket.on("leave", (data) => stateScope.#managementService.leave(socket.id, data));
      socket.on("disconnect", (data) =>  stateScope.#managementService.disconnect(socket.id, data));
    });
  }

  start() {
    this.#logger.debug("[MainEngine] Initializing...");
    this.#setEventHandlers();
    this.#logger.debug("[MainEngine] Initialized");
  }
}

module.exports = MainEngine;
