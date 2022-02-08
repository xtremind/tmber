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
    currentPlayer.setName(data.name);

    var bot = this.#players.get(currentPlayer.uuid());
    if (typeof bot !== "undefined"  && !bot.isPlayer()){
      var currentGame = this.#games.get(bot.inGame());
      
      if (typeof currentGame !== "undefined" && currentGame.status() == State.RUNNING) {
        currentGame.replace(bot, currentPlayer);
        currentPlayer.goInGame(bot.inGame());
        this.#players.delete(bot.uuid());
        currentPlayer.socket().emit('ready?', {"id": currentGame.id(), "hostname": currentGame.hostname()});
        this.#logger.debug("["+playerId+"] rejoin a running game", data);
      }
    } else {
      this.#logger.debug("["+playerId+"] no known game for this player", data);
    }

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
    
    if (typeof currentGame !== "undefined" && currentGame.status() == State.WAITING) {
        if(currentGame.players().length > 8 ){
          currentPlayer.socket().emit("error", { message: "too many player in game" });
        }
        currentGame.add(currentPlayer);
        currentPlayer.goInGame(currentGame.id());
        //join game
        currentPlayer.socket().emit("joined", { id: currentGame.id() , "hostname": currentGame.hostname() });
        // join a room to only communicate in
        currentPlayer.socket().join(currentGame.id());
        //update list player for joined game
        currentPlayer.socket().to(currentGame.id()).emit("players", currentGame.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
        if(currentGame.players().length >= 8 ){
          currentPlayer.socket().broadcast.emit("games", this.#waitingGames().map((game) => {return {"id": game.id(), "hostname": game.hostname()}}));
        }
        this.#logger.debug("["+playerId+"] gamed joined", data);
    } else {
      currentPlayer.socket().emit("error", { message: "not joinable game" });
    }
  }

  addBot(playerId, data) {
    this.#logger.debug("["+playerId+"] add a bot", data);
    var currentGame = this.#games.get(data.id);
    if (typeof currentGame !== "undefined") {
      if(currentGame.players().length > 8 ){
        currentPlayer.socket().emit("error", { message: "too many player in game" });
      }
      var bot = new Bot();
      bot.setUuid(uuidv4()); 
      bot.goInGame(currentGame.id());
      this.#players.set(bot.uuid(), bot);
      currentGame.add(bot);
      currentGame.socket().to(currentGame.id()).emit("players", currentGame.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
      currentGame.socket().emit("players", currentGame.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
      if(currentGame.players().length >= 8 ){
        currentGame.socket().broadcast.emit("games", this.#waitingGames().map((game) => {return {"id": game.id(), "hostname": game.hostname()}}));
      }
    }
  }

  removeBot(playerId, data) {
    this.#logger.debug("["+playerId+"] removing a bot", data);
    var currentBot = this.#players.get(data.id);
    var currentGame = this.#games.get(currentBot.inGame());
    
    currentBot.leaveGame();
    if (typeof currentGame !== "undefined") {
      this.#leaveWaitingGameAsBot(playerId, currentBot, currentGame);
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

  start(playerId, data) {
    this.#logger.debug("["+playerId+"] start a game", data);
    var currentPlayer = this.#players.get(playerId);
    var currentGame = this.#games.get(data.id);

    if (typeof currentGame !== "undefined") {
      if (currentGame.isReadyToStart()){
        //prepare game
        currentGame.start();
        currentPlayer.socket().broadcast.emit("games", this.#waitingGames().map((g) => {return {"id": g.id()}}));
        return currentGame;
      } else {
        this.#logger.debug("["+playerId+"] game cannot be started yet");
      }
    } else {
      this.#logger.debug("["+playerId+"] unknown game");
    }
    return;
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
    if(game.status() == State.WAITING) {
      if(game.isHostedBy(player)){
        this.#leaveWaitingGameAsHost(playerId, player, game);
      } else {
        this.#leaveWaitingGameAsPlayer(playerId, player, game);
      }
    } else if(game.status() == State.RUNNING) {
      this.#leaveRunningGame(playerId, player, game);
    }
  }

  #leaveWaitingGameAsHost(playerId, player, game){
    this.#logger.debug("["+playerId+"] leave game as host");
    // all should leave
    player.socket().to(game.id()).emit("leave");
    player.socket().leave(game.id());
    game.players().forEach((p => p.isPlayer() && p.socket().leave(game.id())))
    // delete hosted game
    this.#games.delete(game.id());
    player.socket().broadcast.emit("games", this.#waitingGames().map((g) => {return {"id": g.id()}}));
  }

  #leaveWaitingGameAsPlayer(playerId, player, game){
    this.#logger.debug("["+playerId+"] leave game as player");
    game.remove(player);
    //update list player for leaving game 
    player.socket().to(game.id()).emit("players", game.players().map((p) => {return {"id": p.uuid(), "name": p.name(), "isPlayer": p.isPlayer()}}));
    // leave a room to only communicate in
    player.socket().leave(game.id());
    if(game.players().length < 8 ){
      game.socket().broadcast.emit("games", this.#waitingGames().map((g) => {return {"id": g.id(), "hostname": g.hostname()}}));
    }
  }

  #leaveWaitingGameAsBot(playerId, bot, game){
    this.#logger.debug("["+playerId+"] leave game as player");
    game.remove(bot);
    game.socket().to(game.id()).emit("players", game.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
    game.socket().emit("players", game.players().map((player) => {return {"id": player.uuid(), "name": player.name(), "isPlayer": player.isPlayer()}}));
    if(game.players().length < 8 ){
      game.socket().broadcast.emit("games", this.#waitingGames().map((g) => {return {"id": g.id(), "hostname": g.hostname()}}));
    }
  }

  #leaveRunningGame(playerId, player, game){
    this.#logger.debug("["+playerId+"] leave running game");
    var nbPlayers = game.players().filter(p => p.isPlayer()).length;
    if(nbPlayers > 1){
      this.#logger.debug("["+playerId+"] leave running game that still has players");
      //if there's more than 1 player, we replace the leaving player by a bot
      var bot = new Bot();
      
      bot.setUuid(player.uuid());
      bot.goInGame(game.id());
      this.#players.set(bot.uuid(), bot);
      this.#players.delete(playerId);
      
      game.replace(player, bot);
    } else {
      this.#logger.debug("["+playerId+"] leave running game that has no players");
      // else, we stop the game
      game.end();
      //remove all bot in players
      game.players().forEach(p => (p.isPlayer() && this.#players.delete(p.socket().id)) || (!p.isPlayer() && this.#players.delete(p.uuid())));
      //remove game
      this.#games.delete(game.id());
    }
  }

  #waitingGames(){
    return Array.from(this.#games.values()).filter(game => game.isWaitingPlayer());
  }
}

module.exports = ManagementService;
