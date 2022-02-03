import {Scene} from 'phaser';

class GameScene extends Scene {
    constructor() {
      super({
        key: 'GameScene'
      });
    }
  
    create() {
      console.log("GameScene.create");
      this.#createBoard()
      this.#addListener()
      //this.scene.start('PreloadScene');
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