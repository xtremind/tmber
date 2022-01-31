const State = require("./State");

class Game {

  #id = "";
  #host = {};
  #players = [];
  #status = State.WAITING;

  constructor(id, host) {
    this.#id = id;
    this.#host = host;
    this.#players.push(host)
  }

  id(){
    return this.#id;
  }

  players(){
    return this.#players;
  }

  add(player){
    if (!this.#players.some((p) => p.uuid() === player.uuid())){
      //a player can only be added once
      this.#players.push(player);
    }
  }

  remove(player){
    //remove a player from the list
    this.#players = this.#players.filter(p => p.uuid() !== player.uuid());
  }

  replace(outgoingUser, incomingUser){
    //change player by bot, or bot by player if uuid are the same
  }

  status(){
    return this.#status;
  }

  isHostedBy(player){ 
    return this.#host.uuid() === player.uuid();
  }

}

module.exports = Game;