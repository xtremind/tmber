const Player = require("../model/Player");

class MainEngine {
  #io;
  #logger;

  #players = new Map();

  constructor(io, logger) {
    this.#io = io;
    this.#logger = logger;
  }

  #setEventHandlers() {
    const stateScope = this;

    // listen socket
    this.#io.on("connection", (socket) => {
      this.#logger.debug("[SOCKET] connect a player: " + socket.id);
      this.#players.set(socket.id, new Player(socket));

      socket.on("identify", stateScope.#identify.bind(stateScope, socket));
      
      socket.on("disconnect", stateScope.#disconnect.bind(stateScope, socket));
    });
  }

  #identify(socket, data) {
    this.#logger.debug("[SOCKET] identify a player", data);
    var currentPlayer = this.#players.get(socket.id);
    currentPlayer.setUuid(data.uuid);
  }

  #disconnect(socket) {
    this.#logger.debug("[SOCKET] disconnect a player: " + socket.id);
    this.#players.delete(socket.id);
  }

  start() {
    this.#logger.debug("[MainEngine] Initializing...");
    this.#setEventHandlers(); // Begin listening for events.
    this.#logger.debug("[MainEngine] Initialized");
  }
}

module.exports = MainEngine;
