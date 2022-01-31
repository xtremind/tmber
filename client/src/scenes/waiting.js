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
      
    //add interactive button
    Graphics.drawButton(sceneScope,
      {x: screenCenterX - 200, y: 280, height: 50,width: 200,},
      Styles.hostButton, "leave game", Styles.hostText, "leave game",
      () => {
        console.log("player leave party");
        sceneScope.sys.game.socket.emit("leave", {id: sceneScope.sys.game.currentGameId,});
        sceneScope.#goToTitle();
      }
    );

    //add listeners
    sceneScope.sys.game.socket.on("players", function (data) {
      console.log("refresh list of players in the game");
      // delete current List            
      for (var key in sceneScope.playersList) {
        sceneScope.playersList[key].destroy();
      }

      sceneScope.playersList = [];
      var position = 0;

      // create new join List
      data.forEach(function (player) {
        sceneScope.playersList[player.id] = sceneScope.add.text(sceneScope.cameras.main.centerX + 100, 235 + 70 * position, player.name, Styles.playerNameText)
        position++;
      });
    })

    sceneScope.sys.game.socket.on("leave", function (data) {
      console.log("host player leave party");
      sceneScope.#goToTitle();
    });

    //ask players in game
    sceneScope.sys.game.socket.emit('players', { id: sceneScope.sys.game.currentGameId });
  }

  #goToTitle(){
    console.log("WaitingScene.#goToTitle");
    this.sys.game.socket.off("players");
    this.sys.game.socket.off("leave");
    this.scene.start('TitleScene');
  }
}

export default WaitingScene;
