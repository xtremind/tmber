class User {

  #uuid = "";         // uuid of player
  #socket = {};       // socket to communicate with player
  #name = ""          // name 
  #isPlayer = null;   // type of user

  constructor(socket, isPlayer) {
    this.#socket = socket;
    this.#isPlayer = isPlayer;
  }

  setUuid(uuid){
    this.#uuid = uuid;
  }

  getUuid(){
    return this.#uuid;
  }
  
  getSocket(){
    return this.#socket;
  }
}

module.exports = User;