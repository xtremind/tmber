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
    return this.#id
  }

  add(player){
    this.#players.push(player);
  }

  remove(player){
    //remove a player from the list
  }

  replace(outgoingUser, incomingUser){
    //change player by bot, or bot by player
  }

  status(){
    return this.#status;
  }

}

module.exports = Game;