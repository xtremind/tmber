
const {cards} = require('../infrastructure/cards/deck.json');

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
    this.#game.players().forEach(p => this.#scores.set(p.uuid(), 0))
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
        player.socket().removeAllListeners("ready")
        stateScope.#playerReady++;
        if (stateScope.#playerReady == stateScope.#game.players().length) {
          stateScope.#logger.debug("["+stateScope.#game.id()+"] everybody is ready - game start");
          stateScope.#startGame();
        }
      });
    });

    /*this.#io.on("reconnect", (socket) => {
      stateScope.#logger.debug("["+stateScope.#game.id()+"]["+socket.id()+"] reconnect");
      //verify socket is from a known user
        //send data to display
        //if user = current user
          // send action
    })*/
  }

  #askReadiness(){
    this.#broadcast('ready?');
  }

  #startGame(){
    this.#logger.debug("["+this.#game.id()+"] startGame");
    this.#broadcast('players', this.#game.players().map(p => {return {"uuid": p.uuid(), "name": p.name()}}));
    this.#nextPlay();
    this.#nextTurn();
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
    this.#currentPlayer = undefined;
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
      let hand = this.#deck.slice(0, this.#game.difficulty().startingHand);
      hand.sort(function (a, b) {
        return a.rank - b.rank;
      });
      this.#givenCards.set(player.uuid(), hand);
      this.#deck = this.#deck.slice(this.#game.difficulty().startingHand, this.#deck.length);
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
    this.#showBoard();
    this.#firstAction();
  }
  
  #computeNextCurrentPlayer(){
    this.#logger.debug("["+this.#game.id()+"] computeNextCurrentPlayer");
    if ( typeof this.#currentPlayer == "undefined"){
      this.#currentPlayer = this.#startingPlayer;
    } else {
      this.#currentPlayer = (this.#currentPlayer + 1) % this.#game.players().length ;
    }
    //send players
    this.#broadcast('players', this.#game.players().map(p => {return {"uuid": p.uuid(), "name": p.name(), "current": this.#game.players()[this.#currentPlayer].uuid() == p.uuid()}}));
  }

  #showBoard(){
    this.#logger.debug("["+this.#game.id()+"] showBoard");
    this.#game.players().forEach(player => {
      if(player.isPlayer()) {
        player.socket().emit('cards', this.#givenCards.get(player.uuid()).map(c => {return {'name': c.filename, 'value': c.value}}));
      }
    });
    
    this.#broadcast('others', [...this.#givenCards.keys()].map(key => {return {"uuid": key, "nb": this.#givenCards.get(key).length }}) );
    this.#broadcast('discard', this.#discard.map(c => {return {'name': c.filename, 'value': c.value}}));
    this.#broadcast('draw', {"size": this.#deck.length});
  }

  #drawACard(){
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] draw a card");
    // draw a card
    var card = this.#deck.slice(0, 1);
    // add card into hand
    let hand = this.#givenCards.get(player.uuid()).concat(card);
    hand.sort((a, b) => a.rank - b.rank);
    this.#givenCards.set(player.uuid(), hand);
    // remove card from draw
    this.#deck = this.#deck.slice(1, this.#deck.length);
    // refresh cards
    player.socket().emit('cards', this.#givenCards.get(player.uuid()).map(c => {return {'name': c.filename, 'value': c.value}}));
    this.#broadcast('others', [...this.#givenCards.keys()].map(key => {return {"uuid": key, "nb": this.#givenCards.get(key).length }}) );
    this.#broadcast('discard', this.#discard.map(c => {return {'name': c.filename, 'value': c.value}}));
    this.#broadcast('draw', {"size": this.#deck.length});
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
      hand.sort((a, b) => a.rank - b.rank);
      this.#givenCards.set(player.uuid(), hand);
      // remove card from discard
      this.#discard = this.#discard.filter(c => c.filename != pickedCard.filename)
      // refresh cards
      player.socket().emit('cards', this.#givenCards.get(player.uuid()).map(c => {return {'name': c.filename, 'value': c.value}}));
      this.#broadcast('others', [...this.#givenCards.keys()].map(key => {return {"uuid": key, "nb": this.#givenCards.get(key).length }}) );
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
    let scoreTmber = this.#computeCurrentScore(this.#givenCards.get(player.uuid()));
    if (this.#validateTimber(scoreTmber)){
      this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] valid timber");
      this.#forgetFirstActionListener();
      this.#computeEndPlay(player, scoreTmber);
    } else {
      this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] invalid timber");
      player.socket().emit('pick?', {'message' : 'bad pick, retry'});
    }
  }

  #computeEndPlay(player, scoreTmber){
    let result = this.#computeResult(player, scoreTmber);
    let endGame = this.#computeScore(result);
    if(endGame){
      this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] End Game");
      this.#game.end();
      this.#game.players().forEach(p => {
        if(p.isPlayer()) {
          p.socket().on("final", () => {
            // send ranking
            p.socket().emit("ranks", this.#computeRank())
            // send reward
            // send achievement ?
            p.socket().removeAllListeners("final")
          })
        }
      })
      // end game
      this.#broadcast('end');
    } else {
      this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] Show current result");
      //show current result
      this.#broadcast('result',
        this.#game.players().map(p => {
          return {
            "uuid": p.uuid(), 
            "name": p.name(), 
            "result": result.get(p.uuid()), 
            "cards" : this.#givenCards.get(p.uuid()).map(c => {return {'name': c.filename, 'value': c.value}})};
        })
      );
      //wait a bit before next turn
      setTimeout(() => {
        this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] Next Play");
        this.#nextPlay();
        this.#nextTurn();
      }, 5000);
    }
  }

  #computeRank(){
    this.#logger.debug("["+this.#game.id()+"] compute rank");
    let ranks = this.#game.players().map(p => {
      return {"name": p.name(), "score": this.#scores.get(p.uuid())}
    });
    ranks.sort((a, b) => a.score - b.score)

    let c = 0, r = 0;
    ranks.map(p => {
      if (c < p.score){
        c = p.score;
        r++;
      }
      return Object.assign(p, {"rank": r});
    })
    return ranks;
  }

  #computeResult(player, scoreTmber){
    this.#logger.debug("["+this.#game.id()+"] compute result");
    let affectMalus = false;
    let result = new Map();      // global score
    // compute play score
    this.#game.players().forEach(p => {
      let score = this.#computeCurrentScore(this.#givenCards.get(p.uuid()))
      result.set(p.uuid(), score);
      this.#logger.debug("["+this.#game.id()+"]["+p.uuid() +"] score : "+ score);
      if(player.uuid() != p.uuid() && scoreTmber >= score){
        affectMalus = true;
      }
    });

    if(affectMalus){
      this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] another player has lesser point than the player ");
      result.set(player.uuid(), result.get(player.uuid()) + this.#game.difficulty().malus);
    }
    return result;
  }

  #computeScore(result){
    this.#logger.debug("["+this.#game.id()+"] compute score");
    let endGame = false;
    // show current play score
    this.#game.players().forEach(p => {
      let nextScore =  this.#scores.get(p.uuid()) + result.get(p.uuid())
      this.#scores.set(p.uuid(), nextScore)
      this.#logger.debug("["+this.#game.id()+"]["+p.uuid() +"] nextScore : "+ nextScore);

        // if nobody has more than 100 point
      if(nextScore >= this.#game.difficulty().endGame){
        endGame = true
      }
    })
    return endGame
  }

  #validateTimber(score){
    this.#logger.debug("["+this.#game.id()+"] validate timber");
    return score <= this.#game.difficulty().maxTmber;
  }

  #computeCurrentScore(cards){
    this.#logger.debug("["+this.#game.id()+"] compute current score"/*, cards*/);
    return cards.reduce((p, c) => p + c.value, 0);
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
      player.socket().on("tmber", () => stateScope.#timber());

      player.socket().emit('pick?');
    } else {
      //bot
    }
  }

  #discardCards(cards){
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] discard cards", cards);
    // receive discarded cards
    // validate discarded cards
    if(this.#validateDiscard(cards)){
      //the cards 
      let discarded = this.#givenCards.get(player.uuid()).filter(card => cards.some(c => c.name == card.filename));
      // discarded to discard pile
      this.#discard = discarded;
      // update player hand
      let hand = this.#givenCards.get(player.uuid())
      discarded.forEach(card => hand = hand.filter(c => c.filename != card.filename))
      this.#givenCards.set(player.uuid(), hand)
      //
      this.#forgetSecondActionListener();
      if(this.#deck.length > 0 ){
        this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] Next Play");
        this.#nextTurn()
      } else {
        this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] No more card to play - End Play");
        this.#computeEndPlay(player, 0);
      }
    } else {
      player.socket().emit('discard?', {'message' : 'bad selection, retry'});
    }
  }

  #validateDiscard(cards){
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] validate discard");
    let result = cards.length > 0;
    result = result && cards.every(c1 => this.#givenCards.get(player.uuid()).some(c2 => c1.name == c2.filename)) //player has all discarded card
    let discarded = this.#givenCards.get(player.uuid()).filter(card => cards.some(c => c.name == card.filename));
    result = result && (
      (discarded.length >= 3 && discarded.every( (element, index) => index == 0 ? true : (element.rank == discarded[index-1].rank+1 && element.suit == discarded[index-1].suit)  )) || // at least 3 consecutive cards with same suits
      discarded.every( (element, index) => index == 0 ? true : element.rank == discarded[index-1].rank ));      // card with same values
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] validate discard " + result);
    return result;
  }

  #forgetSecondActionListener(){
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] forget second Action Listener");
    player.socket().removeAllListeners("discard")
  }

  #secondAction(){
    let player = this.#game.players()[this.#currentPlayer];
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] second action");
    var stateScope = this;
    if(player.isPlayer()){
    // ask current player to discard
      player.socket().on("discard", (cards) => stateScope.#discardCards(cards));
      player.socket().emit('discard?');
    } else {
      //bot
    }
  }
}

module.exports = GameService;