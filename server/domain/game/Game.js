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

  hostname(){
    return this.#host.name();
  }

  socket(){
    return this.#host.socket();
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
    //this.#players[this.#players.map((x, i) => [i, x]).filter(x => x[1].uuid() ==  outgoingUser.uuid())[0][0]] = incomingUser
    var index = this.#players.indexOf(outgoingUser);
    if (index !== -1) {
      this.#players[index] = incomingUser;
    } 
  }

  status(){
    return this.#status;
  }

  isHostedBy(player){ 
    return this.#host.uuid() === player.uuid();
  }

  isWaitingPlayer(){
    return this.#status === State.WAITING && this.#players.length < 8
  }

  isReadyToStart(){
    return this.#status === State.WAITING && this.#players.length <= 8 && this.#players.length > 2
  }

  start(){
    this.#status = State.RUNNING;
  }

  end(){
    this.#status = State.END;
  }
}

module.exports = Game;