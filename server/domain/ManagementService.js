const Player = require("./user/Player");
const Bot = require("./user/Bot");
const Game = require("./game/Game");
const State = require("./game/State");
const { v4: uuidv4 }  = require("uuid");

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
    currentPlayer.socket().emit("players", currentGame.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
  }

  host(playerId, data) {
    this.#logger.debug("["+playerId+"] host a game", data);
    //name a player
    var currentPlayer = this.#players.get(playerId);
    currentPlayer.setName(data.name);
    //create a game and add the player as host
    var currentGame = new Game(currentPlayer.uuid(), currentPlayer);
    this.#games.set(currentGame.id(), currentGame);
    currentPlayer.goInGame(currentGame.id());
    //join created game
    currentPlayer.socket().emit("joined", { id: currentGame.id(), "hostname": currentGame.hostname() });
    //update joinable games
    currentPlayer.socket().broadcast.emit("games", this.#waitingGames().map((game) => {return {"id": game.id(), "hostname": game.hostname()}}));
    // join a room to only communicate in
    currentPlayer.socket().join(currentGame.id());
  }
 
  join(playerId, data) {
    this.#logger.debug("["+playerId+"] join a game", data);
    //name a player
    var currentPlayer = this.#players.get(playerId);
    currentPlayer.setName(data.name);
    //join a game
    var currentGame = this.#games.get(data.id);
    
    if (typeof currentGame !== "undefined") {
      currentGame.add(currentPlayer);
      currentPlayer.goInGame(currentGame.id());
      //join game
      currentPlayer.socket().emit("joined", { id: currentGame.id() , "hostname": currentGame.hostname() });
      // join a room to only communicate in
      currentPlayer.socket().join(currentGame.id());
      //update list player for joined game
      currentPlayer.socket().to(currentGame.id()).emit("players", currentGame.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
    } else {
      currentPlayer.socket().emit("error", { message: "unknown game" });
    }
  }

  addBot(playerId, data) {
    this.#logger.debug("["+playerId+"] add a bot", data);
    var currentGame = this.#games.get(data.id);
    if (typeof currentGame !== "undefined") {
      var bot = new Bot();
      bot.setUuid(uuidv4()); 
      bot.goInGame(currentGame.id());
      this.#players.set(bot.uuid(), bot);
      currentGame.add(bot);
      currentGame.socket().to(currentGame.id()).emit("players", currentGame.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
      currentGame.socket().emit("players", currentGame.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
    }
  }

  removeBot(playerId, data) {
    this.#logger.debug("["+playerId+"] removing a bot", data);
    var currentBot = this.#players.get(data.id);
    var currentGame = this.#games.get(currentBot.inGame());
    
    currentBot.leaveGame();
    if (typeof currentGame !== "undefined") {
      this.#leaveGameAsBot(playerId, currentBot, currentGame);
      this.#logger.debug("["+currentBot.uuid()+"] removed from game");
    } else {
      this.#logger.debug("["+currentBot.uuid()+"] removed");
    }

  }
  
  leave(playerId, data) {
    this.#logger.debug("["+playerId+"] leaving a game", data);
    var currentPlayer = this.#players.get(playerId);
    var currentGame = this.#games.get(data.id);
    
    currentPlayer.leaveGame();
    if (typeof currentGame !== "undefined") {
      this.#leaveGame(playerId, currentPlayer, currentGame);
      this.#logger.debug("["+playerId+"] left from game");
    } else {
      this.#logger.debug("["+playerId+"] left");
    }
  }

  disconnect(playerId) {
    this.#logger.debug("["+playerId+"] disconnecting...");
    // get player 
    var currentPlayer = this.#players.get(playerId);
    //find game if he is in one
    var currentGame = this.#games.get(currentPlayer.inGame());
    
    currentPlayer.leaveGame();
    if (typeof currentGame !== "undefined") {
      this.#leaveGame(playerId, currentPlayer, currentGame);
      this.#logger.debug("["+playerId+"] disconnected from game");
    } else {
      this.#logger.debug("["+playerId+"] disconnected");
    }
    this.#players.delete(playerId);
  }

  #leaveGame(playerId, player, game){
    this.#logger.debug("["+playerId+"] leave game");
    if(game.isHostedBy(player)){
      this.#leaveGameAsHost(playerId, player, game)
    } else {
      this.#leaveGameAsPlayer(playerId, player, game)
    }
    //if game is waiting
      // if hosted
        // aks other to leave
        // remove player from game
        // update list players
        // remove players from room
        // delete game
        // update list games
      //else 
        // remove player from game
        // update list players
        // remove player from room
    //else if game is running
      // replace player by bot
  }

  #leaveGameAsHost(playerId, player, game){
    this.#logger.debug("["+playerId+"] leave game as host");
    // all should leave
    player.socket().to(game.id()).emit("leave");
    player.socket().leave(game.id());
    game.players().forEach((p => p.isPlayer() && p.socket().leave(game.id())))
    // delete hosted game
    this.#games.delete(game.id());
    player.socket().broadcast.emit("games", this.#waitingGames().map((g) => {return {"id": g.id()}}));
  }

  #leaveGameAsPlayer(playerId, player, game){
    this.#logger.debug("["+playerId+"] leave game as player");
    game.remove(player);
    //update list player for leaving game 
    player.socket().to(game.id()).emit("players", game.players().map((p) => {return {"id": p.uuid(), "name": p.name(), "isPlayer": p.isPlayer()}}));
    // leave a room to only communicate in
    player.socket().leave(game.id());
  }

  #leaveGameAsBot(playerId, bot, game){
    this.#logger.debug("["+playerId+"] leave game as player");
    game.remove(bot);
    game.socket().to(game.id()).emit("players", game.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
    game.socket().emit("players", game.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
  }

  #waitingGames(){
    return Array.from(this.#games.values()).filter(game => game.status() === State.WAITING);
  }
}

module.exports = ManagementService;
