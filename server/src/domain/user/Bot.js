const User = require('./User');
const Strategy = require('../strategy/Strategy');

class Bot extends User {
  constructor() {
    super(null, false);
  }

  setUuid(uuid){
    super.setUuid(uuid);
    super.setName('bot_' + uuid.substring(uuid.length-6, uuid.length));
  }

  chooseFirstAction(pick, draw, timber){
    //choose action between pick, draw, timber
    console.log("bot.chooseFirstAction")
    setTimeout(() => {
        Strategy.chooseAction(this.hand(), pick, draw, timber);
      }, 500);
  }

  forgetFirstAction(){
    console.log("bot.forgetFirstAction")
  }

  chooseSecondAction(discard){
    console.log("bot.chooseSecondAction")
    //define which cards to discard
    setTimeout(() => Strategy.discard(this.hand(), discard), 500);

  }

  forgetSecondAction(){
    console.log("bot.forgetSecondAction")
  }

  //mock socket
  socket(){
    return {
      emit: () => {return;},
      on: () => {return;},
      removeAllListeners: () => {return;}
    };
  }
}

module.exports = Bot;