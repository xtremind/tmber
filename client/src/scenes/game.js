// External Modules
import { Scene } from "phaser";

// Internal Modules
import Graphics from "utils/Graphics";
import Styles from "utils/Styles";

class GameScene extends Scene {
  
  #players = new Map();
  #hand = [];
  #discard = [];

  #separateSpace = 35;
  #centerX;
  #centerY;

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
    console.log("GameScene.#showScore", scores);
  }

  #showHand(cards){
    console.log("GameScene.#showHand", cards);
    if (typeof cards !== "undefined") this.#hand = cards;
    const posX = this.#centerX - ((this.#hand.length - 1) * this.#separateSpace)/2;
    this.#hand.forEach((card, index) => {
      this.add.image(posX + this.#separateSpace * (index /* +1 */), this.cameras.main.height - (card.selected ? 100 : 50), 'cards', card.name)
    });
  }

  #showOthers(others){
    console.log("GameScene.#showOthers", others);
  }

  #showDiscard(discard){
    console.log("GameScene.#showDiscard", discard);
    if (typeof discard !== "undefined") this.#discard = discard;
    
    this.#discard.forEach((card, index) => {
      this.add.image(this.#centerX + 100 + this.#separateSpace * (index /* +1 */), this.#centerY - (card.selected ? 50 : 0), 'cards', card.name)
        .setInteractive()
        .addListener('pointerdown',() => console.log("discard") )
    });

    this.#showDraw()
  }

  #showDraw(){
    console.log("GameScene.#showDraw");
    this.add.image(this.#centerX - 100, this.#centerY+8, 'cards', 'back')
    this.add.image(this.#centerX - 96, this.#centerY+4, 'cards', 'back')
    this.add.image(this.#centerX - 92, this.#centerY, 'cards', 'back')
    this.add.image(this.#centerX - 88, this.#centerY-4, 'cards', 'back')
    this.add.image(this.#centerX - 84, this.#centerY-8, 'cards', 'back')
      .setInteractive()
      .addListener('pointerdown',() => console.log("draw") ) //=> only that one will have a listener
  }

  #showTimber(){
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
  }
}

export default GameScene;