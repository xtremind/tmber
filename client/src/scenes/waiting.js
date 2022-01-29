import {Scene} from 'phaser';

class WaitingScene extends Scene {
    constructor() {
      super({
        key: 'WaitingScene'
      });
    }
  
    create() {
      console.log("WaitingScene.create");
      //this.scene.start('PreloadScene');
    }
  
  }
  
  export default WaitingScene;