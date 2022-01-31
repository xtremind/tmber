const Player = require("./user/Player");
const Game = require("./game/Game");
const State = require("./game/State");

class ManagementService {

  #logger;
  #players = new Map();
  #games = new Map();

  constructor(logger) {
    this.#logger = logger;
  }

  connect(socket) {
    this.#logger.debug("["+socket.id+"] connected");
    this.#players.set(socket.id, new Player(socket));
  }

  identify(playerId, data) {
    this.#logger.debug("["+playerId+"] identified", data);
    var currentPlayer = this.#players.get(playerId);
    currentPlayer.setUuid(data.uuid);
  }

  games(playerId, data) {
    this.#logger.debug("["+playerId+"] games", data);
    this.#players.get(playerId).socket().emit("games", this.#waitingGames().map((game) => {return {"id": game.id(), "hostname": game.hostname()}}));
  }

  players(playerId, data) {
    this.#logger.debug("["+playerId+"] players", data);
    var currentPlayer = this.#players.get(playerId);
    var currentGame = this.#games.get(data.id); 
    currentPlayer.socket().emit("players", currentGame.players().map((player) => {return {"id": player.uuid(), "name": player.name()}}));
  }

  host(playerId, data) {
    this.#logger.debug("["+playerId+"] host a game", data);
    //name a player
    var currentPlayer = this.#players.get(playerId);
    currentPlayer.setName(data.name);
    //create a game and add the player as host
    var currentGame = new Game(currentPlayer.uuid(), currentPlayer);
    this.#games.set(currentGame.id(), currentGame);
    //join created game
    currentPlayer.socket().emit("joined", { id: currentGame.id(), "hostname": currentGame.hostname() });
    //update joinable games
    currentPlayer.socket().broadcast.emit("games", this.#waitingGames().map((game) => {return {"id": game.id(), "hostname": game.hostname()}}));
    // join a room to only communicate in
    currentPlayer.socket().join(currentGame.id());
  }
 
  join(playerId, data)  {
    this.#logger.debug("["+playerId+"] join a game", data);
    //name a player
    var currentPlayer = this.#players.get(playerId);
    currentPlayer.setName(data.name);
    //join a game
    var currentGame = this.#games.get(data.id);
    
    if (typeof currentGame !== "undefined") {
      currentGame.add(currentPlayer);
      //join game
      currentPlayer.socket().emit("joined", { id: currentGame.id() , "hostname": currentGame.hostname() });
      // join a room to only communicate in
      currentPlayer.socket().join(currentGame.id());
      //update list player for joined game
      currentPlayer.socket().to(currentGame.id()).emit("players", currentGame.players().map((player) => {return {"id": player.uuid(), "name": player.name()}}));
    } else {
      currentPlayer.socket().emit("error", { message: "unknown game" });
    }
  }

  
  leave(playerId, data)  {
    this.#logger.debug("["+playerId+"] leave a game", data);
    var currentPlayer = this.#players.get(playerId);
    var currentGame = this.#games.get(data.id);
    if(currentGame.isHostedBy(currentPlayer)){
      // all should leave
      currentPlayer.socket().to(currentGame.id()).emit("leave");
      currentPlayer.socket().leave(currentGame.id());
      currentGame.players().forEach((player => player.socket().leave(currentGame.id())))
      // delete hosted game
      this.#games.delete(currentGame.id());
      currentPlayer.socket().broadcast.emit("games", this.#waitingGames().map((game) => {return {"id": game.id()}}));
    } else {
      currentGame.remove(currentPlayer);
      //update list player for leaving game
      currentPlayer.socket().to(currentGame.id()).emit("players", currentGame.players().map((player) => {return {"id": player.uuid(), "name": player.name()}}));
      // leave a room to only communicate in
      currentPlayer.socket().leave(currentGame.id());
    }
  }

  disconnect(playerId) {
    this.#logger.debug("["+playerId+"] disconnected");
    this.#players.delete(playerId);
  }

  #waitingGames(){
    return Array.from(this.#games.values()).filter(game => game.status() === State.WAITING);
  }
}

module.exports = ManagementService;
