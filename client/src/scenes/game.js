// External Modules
import { Scene } from "phaser";

// Internal Modules
import Graphics from "utils/Graphics";
import Styles from "utils/Styles";
import Action from 'commons/Action'


class GameScene extends Scene {
  
  #players = new Map();
  #hand = [];
  #discard = [];
  #currentAction = Action.WAIT;

  #separateSpace = 35;
  #centerX;
  #centerY;
  
  #displayedElements = new Map();

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create() {
    console.log("GameScene.create");
    this.#centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    this.#centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
    this.#createBoard()
    this.#addListener()
    this.sys.game.socket.emit('ready');
  }

  #createBoard(){
    console.log("GameScene.#createBoard");
    const sceneScope = this;
    //add background image
    sceneScope.add.image(0, 0, "cardTable").setOrigin(0);
    sceneScope.#showDraw();
  }

  #showScore(scores){
    // FIXME : remove all elements before refreshing
    console.log("GameScene.#showScore", scores);
  }

  #showHand(cards){
    console.log("GameScene.#showHand", cards);
    var sceneScope = this;
    if (typeof cards !== "undefined") this.#hand = cards;
    this.#destroyAll('hand');
    const posX = this.#centerX - ((this.#hand.length - 1) * this.#separateSpace)/2;
    this.#hand.forEach((card, index) => {
      let image = this.add.image(posX + this.#separateSpace * (index /* +1 */), this.cameras.main.height - (card.selected ? 100 : 50), 'cards', card.name);
      
      image.setInteractive();
      image.addListener('pointerdown',() => {
        if (sceneScope.#currentAction == Action.DISCARD){
          console.log("select", card);
          card.selected = (!card.selected);
          sceneScope.#showHand();
        } else {
          console.log("bad action"); 
        }
      });
      this.#add('hand', image);
    });
    //if at least 1 selected, display discard button
    if(this.#hand.some(card => card.selected) && sceneScope.#currentAction == Action.DISCARD){
      let discardButton = Graphics.drawButton(sceneScope,
        {x: 200, y: 350, height: 50,width: 200,},
        Styles.hostButton, "discard", Styles.hostText, "discard",
        () => {
          console.log("GameScene.#showHand - discard");
          if (sceneScope.#currentAction == Action.DISCARD){
            sceneScope.#currentAction = Action.WAIT;
            sceneScope.#showHand();
            sceneScope.sys.game.socket.emit("discard", sceneScope.#hand.filter(card => card.selected).map(card => {return {"name":card.name}}));
          } else {
            console.log("bad action"); 
          }
        }
      );
      
      this.#add('hand', discardButton);
    }
  }

  #showOthers(others){
    // FIXME : remove all elements before refreshing
    console.log("GameScene.#showOthers", others);
  }

  #showDiscard(discard){
    console.log("GameScene.#showDiscard", discard);
    var sceneScope = this;
    if (typeof discard !== "undefined") this.#discard = discard;
    this.#destroyAll('discard');

    this.#discard.forEach((card, index) => {
      let image = this.add.image(this.#centerX + 100 + this.#separateSpace * (index /* +1 */), this.#centerY - (card.selected ? 50 : 0), 'cards', card.name);
      image.setInteractive();
      image.addListener('pointerdown',() => {
        if (sceneScope.#currentAction == Action.PICKUP){
          console.log("pick ", card) 
          sceneScope.#currentAction = Action.WAIT;
          sceneScope.sys.game.socket.emit("pick", card);
        } else {
          console.log("bad action"); 
        }
      })
      this.#add('discard', image);
    });
  }

  #showDraw(){
    console.log("GameScene.#showDraw");
    var sceneScope = this;
    this.add.image(this.#centerX - 100, this.#centerY+8, 'cards', 'back')
    this.add.image(this.#centerX - 96, this.#centerY+4, 'cards', 'back')
    this.add.image(this.#centerX - 92, this.#centerY, 'cards', 'back')
    this.add.image(this.#centerX - 88, this.#centerY-4, 'cards', 'back')
    this.add.image(this.#centerX - 84, this.#centerY-8, 'cards', 'back')
      .setInteractive()
      .addListener('pointerdown',() => {
        if (sceneScope.#currentAction == Action.PICKUP){
          console.log("draw"); 
          sceneScope.#currentAction = Action.WAIT;
          sceneScope.sys.game.socket.emit("draw");
        } else {
          console.log("bad action"); 
        }
      }) //=> only that one will have a listener
  }

  #showTimber(){
    // FIXME : remove all elements before refreshing
    console.log("GameScene.#showTimber");
    
    /*
    const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;

    sceneScope.startButton = Graphics.drawButton(sceneScope,
      {x: screenCenterX - 200, y: 350, height: 50,width: 200,},
      Styles.hostButton, "start game", Styles.hostText, "start game",
      () => {
        console.log("WaitingScene.#addStartButton - start game");
        sceneScope.sys.game.socket.emit("test", {id: sceneScope.sys.game.currentGameId,});
      }
    );*/
  }

  #addListener(){
    console.log("GameScene.#addListener");
    var sceneScope = this;
    
    sceneScope.sys.game.socket.on("players", players => players.forEach(player => sceneScope.#players.set(player.id, player)));
    sceneScope.sys.game.socket.on("score", scores => sceneScope.#showScore(scores));
    sceneScope.sys.game.socket.on("cards", cards => sceneScope.#showHand(cards));
    sceneScope.sys.game.socket.on("others", others => sceneScope.#showOthers(others));
    sceneScope.sys.game.socket.on("discard", discarded => sceneScope.#showDiscard(discarded));
    sceneScope.sys.game.socket.on("pick?", () => sceneScope.#currentAction = Action.PICKUP);
    sceneScope.sys.game.socket.on("discard?", () => sceneScope.#currentAction = Action.DISCARD);
  }

  #add(id, element){
    let elements = this.#displayedElements.get(id)
    if(typeof elements == "undefined" || elements.length == 0)
      elements = []
    elements.push(element);
    this.#displayedElements.set(id, elements)
  }

  #destroyAll(id){
    let elements = this.#displayedElements.get(id);
    if(typeof elements == "undefined")
      return;
    elements.forEach(element => element.destroy())
  }

}

export default GameScene;