import {Scene} from 'phaser';

class BootScene extends Scene {
    constructor() {
      super({
        key: 'BootScene'
      });
    }
  
    preload() {
      console.log("BootScene.preload");
      this.scene.start('PreloadScene');
    }
  
  }
  
  export default BootScene;