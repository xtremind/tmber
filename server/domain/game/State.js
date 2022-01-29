class State {
  // Create new instances of the same class as static attributes
  static WAITING = new State("waiting");
  static RUNNING = new State("running");
  static END = new State("end");

  constructor(name) {
    this.name = name
  }
}

module.exports = State;