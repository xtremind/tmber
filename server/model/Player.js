const User = require('./User');

class Player extends User {
  constructor(socket) {
    super(socket, true)
  }
}


module.exports = Player;