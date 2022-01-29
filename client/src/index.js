// Modules
import {Game} from 'phaser';
import { io } from 'socket.io-client'

// Scenes
import BootScene from 'scenes/boot';
import PreloadScene from 'scenes/preload';
import TitleScene from 'scenes/title';
import WaitingScene from 'scenes/waiting';

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
  dom: {
      createContainer: true
  },
  pixelArt: true,
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    WaitingScene
  ]
};

var game = new Game(config);

// add socket client to game
const socket = io({reconnectionAttempts: 5 });
game.socket = socket;
