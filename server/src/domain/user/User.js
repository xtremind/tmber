class User {

  #uuid = "";         // uuid of player
  #socket = {};       // socket to communicate with player
  #name = ""          // name 
  #isPlayer = null;   // type of user
  #inGame = undefined;// id of game where the user is

  #hand = []          // cards in hand

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

  hand(){
    return this.#hand;
  }

  setHand(cards){
    this.#hand = cards;
    
    this.#hand.sort(function (a, b) {
      return a.rank - b.rank;
    });
  }

  //addCardsInHand
  //removeCardsFromHand
  //emptyHand

  //addListener, emit, broadcast, joinRoom, emitRoom
}

module.exports = User;