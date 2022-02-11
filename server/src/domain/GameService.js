
const {cards} = require('../infrastructure/cards/cards.json');


class GameService {

  #io;
  #logger;
  #game;
  #playerReady = 0

  #startingPlayer;
  #currentPlayer;

  #deck = []                // draw pile
  #discard = [];            // discarded pile (last played card)
  #givenCards = new Map();  // players' hands
  #scores = new Map();      // global score

  #players = new Map();      // global score

  constructor(io, game, logger) {
    this.#io = io;
    this.#logger = logger;
    this.#game = game;
  }

  start(){
    this.#logger.debug("["+this.#game.id()+"] starting...");
    this.#initiateScore();
    this.#setEventHandlers();
    this.#askReadiness()
    this.#logger.debug("["+this.#game.id()+"] started");
  }

  #broadcast(message, content){
    return this.#io.to(this.#game.id()).emit(message, content);;
  }

  #initiateScore(){
    this.#logger.debug("["+this.#game.id()+"] initiateScore");
    this.#game.players().forEach(p => this.#scores.set(p.uuid(), {uuid : p.uuid(), score: 0}))
  }

  #setEventHandlers(){
    this.#logger.debug("["+this.#game.id()+"] setEventHandlers");
    var stateScope = this;
    this.#game.players().forEach(player => {
      // each bot is already ready
      if(!player.isPlayer()) {
        stateScope.#logger.debug("["+stateScope.#game.id()+"]["+player.uuid()+"] ready");
        stateScope.#playerReady++;
        return;
      }
      //is ready
      player.socket().on("ready", () => {
        stateScope.#logger.debug("["+stateScope.#game.id()+"]["+player.uuid()+"] ready");
        stateScope.#playerReady++;
        if (stateScope.#playerReady == stateScope.#game.players().length) {
          stateScope.#logger.debug("["+stateScope.#game.id()+"] everybody is ready - game start");
          stateScope.#startGame();
        }
      });
    });
  }

  #askReadiness(){
    this.#broadcast('ready?');
  }

  #startGame(){
    this.#logger.debug("["+this.#game.id()+"] startGame");
    this.#broadcast('players', this.#game.players().map(p => {return {"uuid": p.uuid(), "name": p.name()}}));
    this.#nextPlay();
    this.#nextTurn();
    this.#showBoard();
    this.#firstAction();
  }
  
  #nextPlay(){
    this.#logger.debug("["+this.#game.id()+"] prepareNextPlay");
    this.#computeNextStartingPlayer();
    this.#randomizeDeck();
    this.#distributeGiven();
    this.#discardOneCard();
    this.#broadcast('score', [...this.#scores.keys() ].map(key => {return {"uuid": key, "score": this.#scores.get(key) }}));
  }

  #computeNextStartingPlayer(){
    this.#logger.debug("["+this.#game.id()+"] computeNextStartingPlayer");
    if ( typeof this.#startingPlayer == "undefined"){
      this.#startingPlayer = 0;
    } else {
      this.#startingPlayer = (this.#startingPlayer + 1) % this.#game.players().length ;
    }
  }
  
  #randomizeDeck() {
    this.#logger.debug("["+this.#game.id()+"] randomizeDeck");
    this.#deck = cards.slice();
    this.#deck.sort(function () { return 0.5 - Math.random() });
  }

  #distributeGiven(){
    this.#logger.debug("["+this.#game.id()+"] distributeGiven");
    this.#game.players().forEach(player => {
      let hand = this.#deck.slice(0, 5);
      hand.sort(function (a, b) {
        return a.value - b.value;
      });
      this.#givenCards.set(player.uuid(), hand);
      this.#deck = this.#deck.slice(5, this.#deck.length);
    });
  }

  #discardOneCard(){
    this.#logger.debug("["+this.#game.id()+"] discardOneCard");
    this.#discard = this.#deck.slice(0, 1);
    this.#deck = this.#deck.slice(1, this.#deck.length);
  }

  #nextTurn(){
    this.#logger.debug("["+this.#game.id()+"] prepareTurnPlay");
    this.#computeNextCurrentPlayer();
  }
  
  #computeNextCurrentPlayer(){
    this.#logger.debug("["+this.#game.id()+"] computeNextCurrentPlayer");
    if ( typeof this.#currentPlayer == "undefined"){
      this.#currentPlayer = 0;
    } else {
      this.#currentPlayer = (this.#currentPlayer + 1) % this.#game.players().length ;
    }
  }

  #showBoard(){
    this.#logger.debug("["+this.#game.id()+"] showBoard");
    this.#game.players().forEach(player => {
      if(player.isPlayer()) {
        player.socket().emit('cards', this.#givenCards.get(player.uuid()).map(c => {return {'name': c.filename, 'value': c.value}}));
        player.socket().emit('others', [...this.#givenCards.keys()].filter(key => key != player.uuid()).map(key => {return {"uuid": key, "nb": this.#givenCards.get(key).length }}) );
      }
    });
    
    this.#broadcast('discard', this.#discard.map(c => {return {'name': c.filename, 'value': c.value}}));
  }

  #drawACard(){
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] draw a card");
    // draw a card
    var card = this.#deck.slice(0, 1);
    // add card into hand
    let hand = this.#givenCards.get(player.uuid()).concat(card);
    hand.sort((a, b) => a.value - b.value);
    this.#givenCards.set(player.uuid(), hand);
    // remove card from draw
    this.#deck = this.#deck.slice(1, this.#deck.length);
    // refresh cards
    player.socket().emit('cards', this.#givenCards.get(player.uuid()).map(c => {return {'name': c.filename, 'value': c.value}}));
    this.#broadcast('discard', this.#discard.map(c => {return {'name': c.filename, 'value': c.value}}));
    //
    this.#forgetFirstActionListener();
    // next step
    this.#secondAction();
  }

  #pickACard(card){ 
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] pick a card", card);
    let pickedCard = this.#discard.find(c => c.filename == card.name)
    if(typeof card == "undefined"){
      player.socket().emit('pick?');
    } else {
      // add card into hand
      let hand = this.#givenCards.get(player.uuid()).concat([pickedCard]);
      hand.sort((a, b) => a.value - b.value);
      this.#givenCards.set(player.uuid(), hand);
      // remove card from discard
      this.#discard = this.#discard.filter(c => c.filename != pickedCard.filename)
      // refresh cards
      player.socket().emit('cards', this.#givenCards.get(player.uuid()).map(c => {return {'name': c.filename, 'value': c.value}}));
      // refresh discard
      this.#broadcast('discard', this.#discard.map(c => {return {'name': c.filename, 'value': c.value}}));
      //
      this.#forgetFirstActionListener();
      // next step
      this.#secondAction();
    }
  }

  #timber(){
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] timber");
        // receive timber
          // validate timber
          // compute play score
          // show current play score
          // if nobody has more than 100 point
            // next play
          // else 
            // end game
  }

  #forgetFirstActionListener(){
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] forget First Action Listener");
    player.socket().removeAllListeners("pick")
    player.socket().removeAllListeners("draw")
    player.socket().removeAllListeners("tmber")
  }

  #firstAction(){
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] first action");
    var stateScope = this;
    if(player.isPlayer()){
      player.socket().on("pick", (card) => stateScope.#pickACard(card));
      player.socket().on("draw", () => stateScope.#drawACard());
      player.socket().on("tmber", () => stateScope.#pickACard());

      player.socket().emit('pick?');
    } else {
      //bot
    }
  }

  #secondAction(){
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] second action");
    var stateScope = this;
    if(player.isPlayer()){
    // ask current player to discard
    // receive discarded cards
    // validate discarded cards
    // discarded to discard pile 
    // next turn
    } else {
      //bot
    }
  }

  // game
    // compute next starting player 
    // randomize deck
    // distribute given
    // play
      // compute next current player
      // turn
        // update board (cards / draw / discard / game score)
        // ask current player to pickup
          // receive a pickup card
          // validate picked card
          // remove card from discard
          // update board (cards / draw / discard / game score)
          // ask current player to discard
          // receive discarded cards
          // validate discarded cards
          // discarded to discard pile 
          // end turn
        // OR
          // receive timber
          // validate timber
          // compute play score
          // show current play score
          // if nobody has more than 100 point
            // end play
          // else 
            // end game
        // if not validated, go back to current turn with error message
      // end turn => when a player has done all possible action
      

    // end play => when timber or no more card to draw
    
  // end game => when a player has more than 100 points
}

module.exports = GameService;