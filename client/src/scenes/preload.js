import {Scene} from 'phaser';

class PreloadScene extends Scene {
    constructor() {
      super({
        key: 'PreloadScene'
      });
    }
  
    init() { }
  
    preload() {
      console.log("PreloadScene");

      const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2
      const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2
      const loadingLabel = this.add.text(screenCenterX, screenCenterY-30, 'Loading ...', { font: '30px Arial', fill: '#ffffff' }).setOrigin(0.5);
      const progressPercent = this.add.text(screenCenterX, screenCenterY+30, '', { font: '30px Arial', fill: '#ffffff' }).setOrigin(0.5);
      const progressFile = this.add.text(screenCenterX, screenCenterY+60, '', { font: '30px Arial', fill: '#ffffff' }).setOrigin(0.5);

      const progressBox = this.add.graphics();
      progressBox.clear();
      progressBox.fillStyle(0x222222, 0.8);
      progressBox.fillRect(screenCenterX-300, screenCenterY, 600, 60);
      
      const progressBar = this.add.graphics();
      
      // Register a load progress event to show a load bar
      this.load.on('progress', (value) => {
        console.log("PreloadScene - progress");
        progressPercent.setText(parseInt(value*100)+'%')
        progressBar.clear();
        progressBar.fillStyle(0xffffff, 1);
        progressBox.fillRect(screenCenterX-290, screenCenterY+10, 580*value, 40);
      });
   
      // Register a fileprogress event to show loading asset
      this.load.on('fileprogress', (file) => {
        progressFile.setText('Loading asset: '+ file.key);
      });

      // Register a complete event to launch the title screen when all files are loaded
      this.load.on('complete', () => {
        console.log("PreloadScene - complete");
        loadingLabel.destroy();
        progressFile.destroy();
        progressPercent.destroy();
        progressBox.destroy();
        progressBar.destroy();
        //this.scene.start('TitleScene');
      });
  
      //Load all assets
      //this.load.image('cardTable', 'public/img/cardTable.png');
      //this.load.audio('playCard', 'public/audio/playcard.wav');
    }
  }
  
  export default PreloadScene;