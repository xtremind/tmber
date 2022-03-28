const State = require("./State");
const Action = require('../../../../commons/entities/Action')
const difficulty = require('../../../../commons/configuration/difficulties.json')
const {cards} = require('../../infrastructure/cards/deck.json');

class Game {

  #io = {}
  #logger = {};

  #id = "";
  #host = {};
  #players = [];
  #status = State.WAITING;
  #difficulty = difficulty.normal

  #playerReady = 0;
  #startingPlayer;
  #currentPlayer;
  #currentAction = Action.WAIT;

  #deck = []                // draw pile
  #scores= new Map();

  #discard = [];            // discarded pile (last played card)

  constructor(id, host, logger, io) {
    this.#id = id;
    this.#host = host;
    this.#players.push(host)
    this.#logger = logger;
    this.#io = io;
  }

  #broadcast(message, content){
    return this.#io.to(this.#id).emit(message, content);;
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
    this.#logger.debug("[" + this.#id + "] Game.add");
    if (!this.#players.some((p) => p.uuid() === player.uuid())){
      //a player can only be added once
      this.#players.push(player);
    }
  }

  remove(player){
    this.#logger.debug("[" + this.#id + "] Game.remove");
    //remove a player from the list
    this.#players = this.#players.filter(p => p.uuid() !== player.uuid());
  }

  replace(outgoingUser, incomingUser){
    this.#logger.debug("[" + this.#id + "] Game.replace");
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
    this.#logger.debug("[" + this.#id + "] Game.isWaitingPlayer");
    return this.#status === State.WAITING && this.#players.length < this.#difficulty.maxPlayers
  }

  isReadyToStart(){
    this.#logger.debug("[" + this.#id + "] Game.isReadyToStart");
    return this.#status === State.WAITING && this.#players.length <= this.#difficulty.maxPlayers && this.#players.length >= this.#difficulty.minPlayers
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
    this.#logger.debug("[" + this.#id + "] Game.randomizeDeck");
    this.#deck = cards.slice();
    this.#deck.sort(function () { return 0.5 - Math.random() });
  }
  
  nextStartingPlayer(){
    this.#logger.debug("[" + this.#id + "] Game.nextStartingPlayer");
    this.#currentPlayer = undefined;
    if ( typeof this.#startingPlayer == "undefined"){
      this.#startingPlayer = 0;
    } else {
      this.#startingPlayer = (this.#startingPlayer + 1) % this.#players.length ;
    }
  }

  currentPlayer(){
    this.#logger.debug("[" + this.#id + "] Game.currentPlayer");
    return this.#players[this.#currentPlayer];
  }

  nextCurrentPlayer(){
    this.#logger.debug("[" + this.#id + "] Game.nextCurrentPlayer");
    if ( typeof this.#currentPlayer == "undefined"){
      this.#currentPlayer = this.#startingPlayer;
    } else {
      this.#currentPlayer = (this.#currentPlayer + 1) % this.#players.length ;
    }
  }

  scores(){
    return this.#scores;
  }

  initiateScore(){
    this.#logger.debug("[" + this.#id + "] Game.initiateScore");
    this.#players.forEach(p => this.#scores.set(p.uuid(), 0))
  }
  
  computeRank(){
    this.#logger.debug("[" + this.#id + "] Game.computeRank");
    let ranks = this.#players.map(p => {
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

  setDiscard(discard){
    this.#discard = discard;
  }
  
  
  discardFirstCard(){
    this.#discard = this.discard(1);
  }
  
  discard(number) {
    this.#logger.debug("[" + this.#id + "] Game.discard");
    let card = this.#deck.slice(0, number);
    this.#deck = this.#deck.slice(number, this.#deck.length);
    return card;
  }
  
  discards() {
    return this.#discard;
  }

  distributeGiven(){
    this.#logger.debug("[" + this.#id + "] Game.distributeGiven");
    this.#players.forEach(player => player.setHand(this.discard(this.#difficulty.startingHand)));
  }

  newPlayerReady(){
    this.#playerReady++
  }

  isGameReady(){
    this.#logger.debug("[" + this.#id + "] Game.isGameReady");
    return this.#playerReady == this.players().length
  }

  start(){
    this.#status = State.RUNNING;
    this.#logger.debug("["+this.id()+"] starting...");
    this.initiateScore();
    this.#setEventHandlers();
    this.#askReadiness()
    this.#logger.debug("["+this.id()+"] started");
  }

  #setEventHandlers(){
    this.#logger.debug("["+this.id()+"] setEventHandlers");
    var stateScope = this;
    this.players().forEach(player => {
      // each bot is already ready
      if(!player.isPlayer()) {
        stateScope.#logger.debug("["+stateScope.id()+"]["+player.uuid()+"] ready");
        stateScope.newPlayerReady();
        return;
      }
      //is ready
      player.socket().on("ready", () => {
        stateScope.#logger.debug("["+stateScope.id()+"]["+player.uuid()+"] ready");
        player.socket().removeAllListeners("ready")
        stateScope.newPlayerReady();
        if (stateScope.isGameReady()) {
          stateScope.#logger.debug("["+stateScope.id()+"] everybody is ready - game start");
          stateScope.#startGame();
        }
      });
    });

  }

  #askReadiness(){
    this.#broadcast('ready?');
  }

  #startGame(){
    this.#logger.debug("["+this.id()+"] startGame");
    this.#broadcast('players', this.players().map(p => {return {"uuid": p.uuid(), "name": p.name()}}));
    this.#nextPlay();
  }
  
  #nextPlay(){
    this.#logger.debug("["+this.id()+"] nextPlay");
    this.nextStartingPlayer();
    this.randomizeDeck();
    this.distributeGiven();
    this.discardFirstCard();
    this.#broadcast('score', [...this.scores().keys() ].map(key => {return {"uuid": key, "score": this.scores().get(key) }}));
    this.#nextTurn();
  }
  
  #nextTurn(){
    this.#logger.debug("["+this.id()+"] nextTurn");
    this.#currentAction = Action.WAIT;
    this.#computeNextCurrentPlayer();
    this.#showBoard();
    this.#firstAction();
  }
  
  #computeNextCurrentPlayer(){
    this.#logger.debug("["+this.id()+"] computeNextCurrentPlayer");
    this.nextCurrentPlayer()
    //send players
    this.#broadcast('players', this.players().map(p => {return {"uuid": p.uuid(), "name": p.name(), "current": this.currentPlayer().uuid() == p.uuid()}}));
  }

  #showBoard(){
    this.#logger.debug("["+this.id()+"] showBoard");
    this.players().filter(player => player.isPlayer()).forEach(player => player.socket().emit('cards', player.hand().map(c => {return {'name': c.filename, 'value': c.value}})));
    this.#broadcast('others', this.players().map(player => {return {"uuid": player.uuid(), "nb": player.hand().length }}) );
    this.#broadcast('discard', this.discards().map(c => {return {'name': c.filename, 'value': c.value}}));
    this.#broadcast('draw', {"size": this.deck().length});
  }

  #updateHand(player, card){
    // add card into hand
    player.setHand(player.hand().concat(card))
    // refresh board
    player.socket().emit('cards', player.hand().map(c => {return {'name': c.filename, 'value': c.value}}));
    this.#broadcast('others', this.players().map(player => {return {"uuid": player.uuid(), "nb": player.hand().length }}) );
  }

  #drawACard(){
    let player = this.currentPlayer();
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] draw a card");
    this.#currentAction = Action.PICKUP;
    this.#updateHand(player, this.discard(1));
    this.#broadcast('draw', {"size": this.deck().length});
    //
    this.#forgetFirstActionListener();
    // next step
    this.#secondAction();
  }

  #pickACard(card){ 
    let player = this.currentPlayer();
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] pick a card", card);
    if(typeof card == "undefined"){
      player.socket().emit('pick?');
    } else {
      this.#currentAction = Action.PICKUP;
      let pickedCard = this.discards().find(c => c.filename == card.name)
      this.#updateHand(player, [pickedCard]);
      // remove card from discard
      this.setDiscard(this.discards().filter(c => c.filename != pickedCard.filename));
      this.#broadcast('discard', this.discards().map(c => {return {'name': c.filename, 'value': c.value}}));
      //
      this.#forgetFirstActionListener();
      // next step
      this.#secondAction(); 
    }
  }

  #timber(){
    let player = this.currentPlayer();
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] timber");
    let scoreTmber = this.#computeCurrentScore(player.hand());
    if (this.#validateTimber(scoreTmber)){
      this.#logger.debug("["+this.id()+"]["+player.uuid() +"] valid timber");
      this.#currentAction = Action.TIMBER;
      this.#forgetFirstActionListener();
      this.#computeEndPlay(player, scoreTmber);
    } else {
      this.#logger.debug("["+this.id()+"]["+player.uuid() +"] invalid timber");
      player.socket().emit('pick?', {'message' : 'bad pick, retry'});
    }
  }

  #computeEndPlay(player, scoreTmber){
    let result = this.#computeResult(player, scoreTmber);
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] Show current result");
    //show current result
    this.#broadcast('result',
      this.players().map(p => {
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
    this.#logger.debug("["+this.id()+"] End Game");
    this.end();
    const ranks = this.computeRank();
    this.players().filter(player => player.isPlayer()).forEach(player => {
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
    this.#logger.debug("["+this.id()+"] compute result");
    let affectMalus = false;
    let result = new Map();      // global score
    // compute play score
    this.players().forEach(p => {
      let score = this.#computeCurrentScore(p.hand())
      result.set(p.uuid(), score);
      this.#logger.debug("["+this.id()+"]["+p.uuid() +"] score : "+ score);
      if(player.uuid() != p.uuid() && scoreTmber >= score){
        affectMalus = true;
      }
    });

    if(affectMalus){
      this.#logger.debug("["+this.id()+"]["+player.uuid() +"] another player has lesser point than the player ");
      result.set(player.uuid(), result.get(player.uuid()) + this.difficulty().malus);
    }
    return result;
  }

  #computeScore(result){
    this.#logger.debug("["+this.id()+"] compute score");
    let endGame = false;
    // show current play score
    this.players().forEach(p => {
      let nextScore =  this.scores().get(p.uuid()) + result.get(p.uuid())
      this.scores().set(p.uuid(), nextScore)
      this.#logger.debug("["+this.id()+"]["+p.uuid() +"] nextScore : "+ nextScore);

        // if nobody has more than 100 point
      if(nextScore >= this.difficulty().endGame){
        endGame = true
      }
    })
    return endGame
  }

  #validateTimber(score){
    this.#logger.debug("["+this.id()+"] validate timber");
    return score <= this.difficulty().maxTmber;
  }

  #computeCurrentScore(cards){
    this.#logger.debug("["+this.id()+"] compute current score"/*, cards*/);
    return cards.reduce((p, c) => p + c.value, 0);
  }

  #forgetFirstActionListener(){
    let player = this.currentPlayer();
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] forget First Action Listener");
    player.forgetFirstAction();
  }

  #firstAction(){
    let player = this.currentPlayer();
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] first action");
    player.chooseFirstAction(this.#pickACard.bind(this), this.#drawACard.bind(this), this.#timber.bind(this));
  }

  #discardCards(cards){
    let player = this.currentPlayer();
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] discard cards", cards);
    // receive discarded cards
    // validate discarded cards
    if(this.#validateDiscard(cards)){
      this.#currentAction = Action.DISCARD;
      //the cards 
      let discarded = player.hand().filter(card => cards.some(c => c.name == card.filename));
      // discarded to discard pile
      this.setDiscard(discarded);
      // update player hand
      let hand = player.hand()
      discarded.forEach(card => hand = hand.filter(c => c.filename != card.filename))
      player.setHand(hand)
      //
      this.#forgetSecondActionListener();
      if(this.deck().length > 0 ){
        this.#logger.debug("["+this.id()+"]["+player.uuid() +"] Next Play");
        this.#nextTurn()
      } else {
        this.#logger.debug("["+this.id()+"]["+player.uuid() +"] No more card to play - End Play");
        this.#computeEndPlay(player, 0);
      }
    } else {
      player.socket().emit('discard?', {'message' : 'bad selection, retry'});
    }
  }

  #validateDiscard(cards){
    let player = this.currentPlayer();
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] validate discard");
    let result = cards.length > 0;
    result = result && cards.every(c1 => player.hand().some(c2 => c1.name == c2.filename)) //player has all discarded card
    let discarded = player.hand().filter(card => cards.some(c => c.name == card.filename));
    result = result && (
      (discarded.length >= 3 && discarded.every( (element, index) => index == 0 ? true : (element.rank == discarded[index-1].rank+1 && element.suit == discarded[index-1].suit)  )) || // at least 3 consecutive cards with same suits
      discarded.every( (element, index) => index == 0 ? true : element.rank == discarded[index-1].rank ));      // card with same values
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] validate discard " + result);
    return result;
  }

  #forgetSecondActionListener(){
    let player = this.currentPlayer();
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] forget second Action Listener");
    player.forgetSecondAction();
  }

  #secondAction(){
    let player = this.currentPlayer();
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] second action");
    player.chooseSecondAction(this.#discardCards.bind(this));
  }

  reconnect(player){
    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] reconnecting ...");
    player.socket().emit('players', this.players().map(p => {return {"uuid": p.uuid(), "name": p.name(), "current": this.currentPlayer().uuid() == p.uuid()}}));
    player.socket().emit('score', [...this.scores().keys() ].map(key => {return {"uuid": key, "score": this.scores().get(key) }}));
    player.socket().emit('cards', player.hand().map(c => {return {'name': c.filename, 'value': c.value}}));
    player.socket().emit('others', this.players().map(player => {return {"uuid": player.uuid(), "nb": player.hand().length }}) );
    player.socket().emit('discard', this.discards().map(c => {return {'name': c.filename, 'value': c.value}}));
    player.socket().emit('draw', {"size": this.deck().length});
    
    if(player.uuid() == this.currentPlayer().uuid()){
      this.#logger.debug("["+this.id()+"]["+player.uuid() +"] send action");
      switch (this.#currentAction) {
        case Action.WAIT:
          //if 1er step player.chooseFirstAction(this.#pickACard.bind(this), this.#drawACard.bind(this), this.#timber.bind(this));
          this.#firstAction();
          break;
        case Action.PICKUP:
          //if 2em step player.chooseSecondAction(this.#discardCards.bind(this));
          this.#secondAction();
          break;
        case Action.TIMBER:
          //...
          break;
        case Action.DISCARD:
          //...
          break;
        default:
          break;
      }
    }

    this.#logger.debug("["+this.id()+"]["+player.uuid() +"] reconnected");
  }

}

module.exports = Game;