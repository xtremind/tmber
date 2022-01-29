// External Modules
import { Scene } from "phaser";

// Internal Modules
import Graphics from "utils/Graphics";
import Styles from "utils/Styles";

class WaitingScene extends Scene {
  constructor() {
    super({
      key: "WaitingScene",
    });
  }

  create() {
    console.log("WaitingScene.create");
    const sceneScope = this;

    //add background image
    sceneScope.add.image(0, 0, "cardTable").setOrigin(0);
    
    //add title
    const screenCenterX =
      sceneScope.cameras.main.worldView.x + sceneScope.cameras.main.width / 2;
    sceneScope.add
      .text(screenCenterX, 100, "♥ ♣  Tmber  ♠ ♦", Styles.titleText)
      .setOrigin(0.5);

    // add a subtitle
    sceneScope.add
      .text(sceneScope.cameras.main.centerX, 200, 'Game ' + sceneScope.sys.game.currentGameId, Styles.subtitleText)
      .setOrigin(0.5);
      
      sceneScope.sys.game.socket.on("players", function (data) {
        console.log("refresh list of players in the game");
        // delete current List            
        for (var key in sceneScope.playersList) {
          Graphics.delete(sceneScope.playersList[key]);
        }

        sceneScope.playersList = [];
        var position = 0;
  
        // create new join List
        data.forEach(function (player) {
          sceneScope.add.text(sceneScope.cameras.main.centerX + 100, 235 + 70 * position, player.name, Styles.playerNameText)
          position++;
        });
      })


    //ask players in game
    sceneScope.sys.game.socket.emit('players', { id: sceneScope.sys.game.currentGameId });
  }
}

export default WaitingScene;
