
class GameService {

  #logger;
  #game;
  #playerReady = 0

  constructor(game, logger) {
    this.#logger = logger;
    this.#game = game;
  }

  start(){
    this.#logger.debug("["+this.#game.id()+"] starting...");
    //initiate all
    this.#setEventHandlers();
    this.#askReadiness()
    this.#logger.debug("["+this.#game.id()+"] started");
  }

  #setEventHandlers(){
    this.#logger.debug("["+this.#game.id()+"] #setEventHandlers");
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