// External Modules
import { Scene } from "phaser";

// Internal Modules
import Graphics from "utils/Graphics";
import Styles from "utils/Styles";

class GameScene extends Scene {
  
  #players = new Map();
  #hand = [];

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create() {
    console.log("GameScene.create");
    var sceneScope = this;
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
    console.log("GameScene.#showScore - " + scores);
  }

  #showHand(cards){
    console.log("GameScene.#showHand - " + cards);
    if (typeof cards !== "undefined") this.#hand = cards;

    const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;

    const posX = screenCenterX - ((this.#hand.length - 1) * 50)/2
    this.#hand.forEach((card, index) => {
      this.add.image(posX + 50 * (index /* +1 */), this.cameras.main.height - (card.selected ? 100 : 50), 'cards', card.name)
    });
  }

  #showOthers(others){
    console.log("GameScene.#showOthers - " + others);
  }

  #showDiscard(discard){
    console.log("GameScene.#showDiscard - " + discard);
  }

  #showDraw(){
    console.log("GameScene.#showDraw");
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