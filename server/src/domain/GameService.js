
const {cards} = require('../infrastructure/cards/cards.json');


class GameService {

  #logger;
  #game;
  #playerReady = 0

  #startingPlayer = 0;
  #currentPlayer = 0;

  #deck = []                // draw pile
  #discard = [];            // discarded pile (last played card)
  #givenCards = new Map();  // players' hands
  #scores = new Map();      // global score

  constructor(game, logger) {
    this.#logger = logger;
    this.#game = game;
  }

  start(){
    this.#logger.debug("["+this.#game.id()+"] starting...");
    this.#initiate();
    this.#setEventHandlers();
    this.#askReadiness()
    this.#logger.debug("["+this.#game.id()+"] started");
  }

  #initiate(){
    this.#logger.debug("["+this.#game.id()+"] initiating...");

    this.#randomizeDeck();
    this.#initiateScore();

    this.#logger.debug("["+this.#game.id()+"] initiated");
  }
  
  #randomizeDeck() {
    this.#logger.debug("["+this.#game.id()+"] randomizeDeck");
    this.#deck = cards.slice();
    this.#deck.sort(function () { return 0.5 - Math.random() });
  }

  #initiateScore(){
    this.#logger.debug("["+this.#game.id()+"] initiateScore");
    this.#game.players().forEach(p => this.#scores.set(p.uuid(), {uuid : p.uuid(), name: p.name(), score: 0}))
  }

  #setEventHandlers(){
    this.#logger.debug("["+this.#game.id()+"] setEventHandlers");
    var stateScope = this;
    this.#game.players().forEach(player => {
      if(!player.isPlayer()) {
        stateScope.#logger.debug("["+stateScope.#game.id()+"]["+player.uuid()+"] ready");
        stateScope.#playerReady++;
        return;
      }

      player.socket().addListener("ready", () => {
        stateScope.#logger.debug("["+stateScope.#game.id()+"]["+player.uuid()+"] ready");
        stateScope.#playerReady++;
        if (stateScope.#playerReady == stateScope.#game.players().length) {
          stateScope.#logger.debug("["+stateScope.#game.id()+"] everybody is ready");
        }
      });
      player.socket().addListener("test", () => {
        stateScope.#logger.debug("["+stateScope.#game.id()+"]["+player.uuid()+"] test");
      });
    });
  }

  #askReadiness(){
    this.#game.players().forEach(player => {
      if(player.isPlayer()){
        player.socket().emit('ready?');
      }
    })
  }

}

module.exports = GameService;