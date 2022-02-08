// External Modules
import { Scene } from "phaser";

// Internal Modules
import Graphics from "utils/Graphics";
import Styles from "utils/Styles";

class GameScene extends Scene {
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
      const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;

      sceneScope.startButton = Graphics.drawButton(sceneScope,
        {x: screenCenterX - 200, y: 350, height: 50,width: 200,},
        Styles.hostButton, "start game", Styles.hostText, "start game",
        () => {
          console.log("WaitingScene.#addStartButton - start game");
          sceneScope.sys.game.socket.emit("test", {id: sceneScope.sys.game.currentGameId,});
        }
      );
    }
  
    #createBoard(){
      console.log("GameScene.#createBoard");
      const sceneScope = this;
      //add background image
      sceneScope.add.image(0, 0, "cardTable").setOrigin(0);
    }

    #addListener(){
      console.log("GameScene.#addListener");

    }

  }
  
  export default GameScene;