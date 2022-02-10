class Action {
  // Create new instances of the same class as static attributes
  static WAIT = new Action("wait");
  static PICKUP = new Action("pickup");
  static TIMBER = new Action("timber");
  static DISCARD = new Action("discard");

  constructor(name) {
    this.name = name
  }
}

module.exports = Action;