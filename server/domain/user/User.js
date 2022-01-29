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
}

module.exports = User;