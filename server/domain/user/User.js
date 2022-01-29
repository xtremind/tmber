class User {

  #uuid = "";         // uuid of player
  #socket = {};       // socket to communicate with player
  #name = ""          // name 
  #isPlayer = null;   // type of user

  constructor(socket, isPlayer) {
    this.#socket = socket;
    this.#isPlayer = isPlayer;
  }

  uuid(uuid){
    this.#uuid = uuid;
  }

  uuid(){
    return this.#uuid;
  }
  
  socket(){
    return this.#socket;
  }

  name(name){
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