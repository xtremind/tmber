
class GameService {

  #io;
  #logger;
  #game;
  #playerReady = 0

  #discard = [];            // discarded pile (last played card)

  constructor(io, game, logger) {
    this.#io = io;
    this.#logger = logger;
    this.#game = game;
  }

  start(){
    this.#logger.debug("["+this.#game.id()+"] starting...");
    this.#game.initiateScore();
    this.#setEventHandlers();
    this.#askReadiness()
    this.#logger.debug("["+this.#game.id()+"] started");
  }

  #broadcast(message, content){
    return this.#io.to(this.#game.id()).emit(message, content);;
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
  }
  
  #nextPlay(){
    this.#logger.debug("["+this.#game.id()+"] prepareNextPlay");
    this.#game.nextStartingPlayer();
    this.#game.randomizeDeck();
    this.#distributeGiven();
    this.#discardFirstCard();
    this.#broadcast('score', [...this.#game.scores().keys() ].map(key => {return {"uuid": key, "score": this.#game.scores().get(key) }}));
    this.#nextTurn();
  }
  
  #distributeGiven(){
    this.#logger.debug("["+this.#game.id()+"] distributeGiven");
    this.#game.players().forEach(player => player.setHand(this.#game.discard(this.#game.difficulty().startingHand)));
  }

  #discardFirstCard(){
    this.#logger.debug("["+this.#game.id()+"] discardFirstCard");
    this.#discard = this.#game.discard(1);
  }

  #nextTurn(){
    this.#logger.debug("["+this.#game.id()+"] prepareTurnPlay");
    this.#computeNextCurrentPlayer();
    this.#showBoard();
    this.#firstAction();
  }
  
  #computeNextCurrentPlayer(){
    this.#logger.debug("["+this.#game.id()+"] computeNextCurrentPlayer");
    this.#game.nextCurrentPlayer()
    //send players
    this.#broadcast('players', this.#game.players().map(p => {return {"uuid": p.uuid(), "name": p.name(), "current": this.#game.currentPlayer().uuid() == p.uuid()}}));
  }

  #showBoard(){
    this.#logger.debug("["+this.#game.id()+"] showBoard");
    this.#game.players().filter(player => player.isPlayer()).forEach(player => player.socket().emit('cards', player.hand().map(c => {return {'name': c.filename, 'value': c.value}})));
    this.#broadcast('others', this.#game.players().map(player => {return {"uuid": player.uuid(), "nb": player.hand().length }}) );
    this.#broadcast('discard', this.#discard.map(c => {return {'name': c.filename, 'value': c.value}}));
    this.#broadcast('draw', {"size": this.#game.deck().length});
  }

  #updateHand(player, card){
    // add card into hand
    player.setHand(player.hand().concat(card))
    // refresh board
    player.socket().emit('cards', player.hand().map(c => {return {'name': c.filename, 'value': c.value}}));
    this.#broadcast('others', this.#game.players().map(player => {return {"uuid": player.uuid(), "nb": player.hand().length }}) );
  }

  #drawACard(){
    let player = this.#game.currentPlayer();
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] draw a card");
    this.#updateHand(player, this.#game.discard(1));
    this.#broadcast('draw', {"size": this.#game.deck().length});
    //
    this.#forgetFirstActionListener();
    // next step
    this.#secondAction();
  }

  #pickACard(card){ 
    let player = this.#game.currentPlayer();
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] pick a card", card);
    if(typeof card == "undefined"){
      player.socket().emit('pick?');
    } else {
      let pickedCard = this.#discard.find(c => c.filename == card.name)
      this.#updateHand(player, [pickedCard]);
      // remove card from discard
      this.#discard = this.#discard.filter(c => c.filename != pickedCard.filename)
      this.#broadcast('discard', this.#discard.map(c => {return {'name': c.filename, 'value': c.value}}));
      //
      this.#forgetFirstActionListener();
      // next step
      this.#secondAction();
    }
  }

  #timber(){
    let player = this.#game.currentPlayer();
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] timber");
    let scoreTmber = this.#computeCurrentScore(player.hand());
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
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] Show current result");
    //show current result
    this.#broadcast('result',
      this.#game.players().map(p => {
        return {
          "uuid": p.uuid(), 
          "name": p.name(), 
          "result": result.get(p.uuid()), 
          "cards" : p.hand().map(c => {return {'name': c.filename, 'value': c.value}})};
      })
    );

    setTimeout(() => this.#computeScore(result) ? this.#computeEndGame() : this.#nextPlay(), 5000);
  }

  #computeEndGame(){
    this.#logger.debug("["+this.#game.id()+"] End Game");
    this.#game.end();
    const ranks = this.#game.computeRank();
    this.#game.players().filter(player => player.isPlayer()).forEach(player => {
      player.socket().on("final", () => {
        // send ranking
        player.socket().emit("ranks", ranks)
        // send reward
        // send achievement ?
        // stop listening
        player.socket().removeAllListeners("final")
      })
    })
    // end game after x time
    this.#broadcast('end');
  }

  #computeResult(player, scoreTmber){
    this.#logger.debug("["+this.#game.id()+"] compute result");
    let affectMalus = false;
    let result = new Map();      // global score
    // compute play score
    this.#game.players().forEach(p => {
      let score = this.#computeCurrentScore(p.hand())
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
      let nextScore =  this.#game.scores().get(p.uuid()) + result.get(p.uuid())
      this.#game.scores().set(p.uuid(), nextScore)
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
    let player = this.#game.currentPlayer();
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] forget First Action Listener");
    player.forgetFirstAction();
  }

  #firstAction(){
    let player = this.#game.currentPlayer();
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] first action");
    player.chooseFirstAction(this.#pickACard.bind(this), this.#drawACard.bind(this), this.#timber.bind(this));
  }

  #discardCards(cards){
    let player = this.#game.currentPlayer();
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] discard cards", cards);
    // receive discarded cards
    // validate discarded cards
    if(this.#validateDiscard(cards)){
      //the cards 
      let discarded = player.hand().filter(card => cards.some(c => c.name == card.filename));
      // discarded to discard pile
      this.#discard = discarded;
      // update player hand
      let hand = player.hand()
      discarded.forEach(card => hand = hand.filter(c => c.filename != card.filename))
      player.setHand(hand)
      //
      this.#forgetSecondActionListener();
      if(this.#game.deck().length > 0 ){
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
    let player = this.#game.currentPlayer();
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] validate discard");
    let result = cards.length > 0;
    result = result && cards.every(c1 => player.hand().some(c2 => c1.name == c2.filename)) //player has all discarded card
    let discarded = player.hand().filter(card => cards.some(c => c.name == card.filename));
    result = result && (
      (discarded.length >= 3 && discarded.every( (element, index) => index == 0 ? true : (element.rank == discarded[index-1].rank+1 && element.suit == discarded[index-1].suit)  )) || // at least 3 consecutive cards with same suits
      discarded.every( (element, index) => index == 0 ? true : element.rank == discarded[index-1].rank ));      // card with same values
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] validate discard " + result);
    return result;
  }

  #forgetSecondActionListener(){
    let player = this.#game.currentPlayer();
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] forget second Action Listener");
    player.forgetSecondAction();
  }

  #secondAction(){
    let player = this.#game.currentPlayer();
    this.#logger.debug("["+this.#game.id()+"]["+player.uuid() +"] second action");
    player.chooseSecondAction(this.#discardCards.bind(this));
  }
}

module.exports = GameService;