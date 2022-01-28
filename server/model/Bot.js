const User = require('./User');

class Bot extends User {
  constructor() {
    super(null, false);
  }
}

module.exports = Bot;