const State = require("./State");
const difficulty = require('../../../../commons/configuration/difficulties.json')
const {cards} = require('../../infrastructure/cards/deck.json');

class Game {

  #id = "";
  #host = {};
  #players = [];
  #status = State.WAITING;
  #difficulty = difficulty.normal

  #startingPlayer;
  #currentPlayer;

  #deck = []                // draw pile
  #scores= new Map();

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
    return this.#status === State.WAITING && this.#players.length < this.#difficulty.maxPlayers
  }

  isReadyToStart(){
    return this.#status === State.WAITING && this.#players.length <= this.#difficulty.maxPlayers && this.#players.length >= this.#difficulty.minPlayers
  }

  start(){
    this.#status = State.RUNNING;
  }

  end(){
    this.#status = State.END;
  }

  difficulty(){
    return this.#difficulty;
  }

  deck(){
    return this.#deck;
  }
  
  randomizeDeck() {
    this.#deck = cards.slice();
    this.#deck.sort(function () { return 0.5 - Math.random() });
  }

  discard(number) {
    let card = this.#deck.slice(0, number);
    this.#deck = this.#deck.slice(number, this.#deck.length);
    return card;
  }
  
  nextStartingPlayer(){
    this.#currentPlayer = undefined;
    if ( typeof this.#startingPlayer == "undefined"){
      this.#startingPlayer = 0;
    } else {
      this.#startingPlayer = (this.#startingPlayer + 1) % this.#players.length ;
    }
  }

  currentPlayer(){
    return this.#players[this.#currentPlayer];
  }

  nextCurrentPlayer(){
    if ( typeof this.#currentPlayer == "undefined"){
      this.#currentPlayer = this.#startingPlayer;
    } else {
      this.#currentPlayer = (this.#currentPlayer + 1) % this.#players.length ;
    }
  }

  scores(){
    return this.#scores;
  }
}

module.exports = Game;