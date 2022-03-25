const ManagementService = require("../../domain/ManagementService");

class MainEngine {
  #io;
  #logger;
  #managementService;

  constructor(io, logger) {
    this.#io = io;
    this.#logger = logger;
    this.#managementService = new ManagementService(logger, io);
  }

  #setEventHandlers() {
    const stateScope = this;

    // listen socket
    this.#io.on("connection", (socket) => {
      stateScope.#managementService.connect(socket);

      //title scene events
      socket.on("identify", (data) => stateScope.#managementService.identify(socket.id, data));
      socket.on("games", (data) => stateScope.#managementService.games(socket.id, data));
      socket.on("host", (data) => stateScope.#managementService.host(socket.id, data));
      socket.on("join", (data) => stateScope.#managementService.join(socket.id, data));
      //waiting scene events
      socket.on("players", (data) => stateScope.#managementService.players(socket.id, data));
      socket.on("add bot", (data) => stateScope.#managementService.addBot(socket.id, data));
      socket.on("remove bot", (data) => stateScope.#managementService.removeBot(socket.id, data));
      socket.on("leave", (data) => stateScope.#managementService.leave(socket.id, data));
      socket.on("start", (data) => stateScope.#managementService.start(socket.id, data));
      
      socket.on("reconnect", (data) => {
        stateScope.#logger.debug("[MainEngine] reconnect...");
        //stateScope.#logger.debug("["+stateScope.#game.id()+"]["+socket.id()+"] reconnect");
        //find corresponding ws, and asks reconnect which will :
          //send data to display
          //if user = current user
            // send action
      })
      //game scene events

      //common events
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
