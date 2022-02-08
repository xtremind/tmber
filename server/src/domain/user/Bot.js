const User = require('./User');

class Bot extends User {
  constructor() {
    super(null, false);
  }

  setUuid(uuid){
    super.setUuid(uuid);
    super.setName('bot_' + uuid.substring(uuid.length-6, uuid.length));
  }
}

module.exports = Bot;