const Player = require("./user/Player");
const Game = require("./game/Game");

class ManagementService {

  #logger;
  #players = new Map();
  #games = new Map();

  constructor(logger) {
    this.#logger = logger;
  }

  connect(socket) {
    this.#logger.debug("[SOCKET] connect a player: " + socket.id);
    this.#players.set(socket.id, new Player(socket));
  }

  identify(playerId, data) {
    this.#logger.debug("[SOCKET] identify a player", data);
    var currentPlayer = this.#players.get(playerId);
    currentPlayer.uuid(data.uuid);
  }

  host(playerId, data) {
    this.#logger.debug("[SOCKET] host a game", data);
    //name a player
    var currentPlayer = this.#players.get(playerId);
    currentPlayer.name(data.name);
    //create a game and add the player as host
    var game = new Game(currentPlayer.uuid(), currentPlayer);
    this.#games.set(game.id, game);
    //answer game created
    currentPlayer.socket().emit("game joined", { id: game.id() });
  }

  disconnect(playerId) {
    this.#logger.debug("[SOCKET] disconnect a player: " + playerId);
    this.#players.delete(playerId);
  }
}

module.exports = ManagementService;
