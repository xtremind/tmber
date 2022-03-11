const User = require('./User');

class Player extends User {
  constructor(socket) {
    super(socket, true)
  }

  chooseFirstAction(pick, draw, timber){
    this.socket().on("pick", (card) => pick(card));
    this.socket().on("draw", () => draw());
    this.socket().on("tmber", () => timber());

    this.socket().emit('pick?');
  }

  forgetFirstAction(){
    this.socket().removeAllListeners("pick")
    this.socket().removeAllListeners("draw")
    this.socket().removeAllListeners("tmber")
  }

  chooseSecondAction(discard){
    this.socket().on("discard", (cards) => discard(cards));

    this.socket().emit('discard?');
  }

  forgetSecondAction(){
    this.socket().removeAllListeners("discard")
  }
}


module.exports = Player;