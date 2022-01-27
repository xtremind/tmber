// Modules
import 'phaser';

// Scenes
import BootScene from './scenes/boot';
import PreloadScene from './scenes/preload';

// Declare configuration
const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'phaser-example',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1200,
    height: 800,
  },
  pixelArt: true,
  scene: [
    BootScene,
    PreloadScene
  ]
};

var game = new Phaser.Game(config);

console.log("--- game started")