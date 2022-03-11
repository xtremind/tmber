const User = require('./User');

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
  }

  forgetFirstAction(){
    console.log("bot.forgetFirstAction")
  }

  chooseSecondAction(discard){
    console.log("bot.chooseSecondAction")
    //define which cards to discard
    //discard(cards);
  }

  forgetSecondAction(){
    console.log("bot.forgetSecondAction")
  }
}

module.exports = Bot;