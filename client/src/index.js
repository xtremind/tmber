// Modules
import {Game} from 'phaser';

// Scenes
import BootScene from 'scenes/boot';
import PreloadScene from 'scenes/preload';
import TitleScene from 'scenes/title';

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
    PreloadScene,
    TitleScene
  ]
};

var game = new Game(config);

console.log("--- game started")