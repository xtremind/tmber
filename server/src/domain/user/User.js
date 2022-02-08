class User {

  #uuid = "";         // uuid of player
  #socket = {};       // socket to communicate with player
  #name = ""          // name 
  #isPlayer = null;   // type of user
  #inGame = undefined;     // id of game where the user is

  constructor(socket, isPlayer) {
    this.#socket = socket;
    this.#isPlayer = isPlayer;
  }

  setUuid(uuid){
    this.#uuid = uuid;
  }

  uuid(){
    return this.#uuid;
  }
  
  socket(){
    return this.#socket;
  }

  setName(name){
    this.#name = name;
  }

  name(){
    return this.#name;
  }

  isPlayer(){
    return this.#isPlayer;
  }

  inGame(){
    return this.#inGame
  }

  goInGame(inGame){
    this.#inGame = inGame;
  }

  leaveGame(){
    this.#inGame = undefined;
  }
}

module.exports = User;