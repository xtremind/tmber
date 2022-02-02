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
      .text(screenCenterX, 200, sceneScope.sys.game.currentHostname + '\'s Game', Styles.subtitleText)
      .setOrigin(0.5);
      
    // add link to game
    sceneScope.#addLinkToGame();

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

      for(var key in sceneScope.botsList) {
        sceneScope.botsList[key].destroy();
      }      
      sceneScope.botsList = [];

      var position = 0;

      // create new join List
      data.forEach(function (player) {
        sceneScope.playersList[player.id] = sceneScope.add.text(sceneScope.cameras.main.centerX + 100, 235 + 50 * position, player.name, Styles.playerNameText)
        if(sceneScope.sys.game.currentGameId === sceneScope.sys.game.currentUuid && !player.isPlayer){
          sceneScope.botsList[player.id] = Graphics.drawButton(sceneScope, { x: sceneScope.cameras.main.centerX + 300, y: 230 + 50 * position, height: 40, width: 200 }, Styles.startButton, 'Remove', Styles.startText, 'Remove', function () {
            console.log("remove bot");
            sceneScope.sys.game.socket.emit('remove bot', { id: player.id });
          });
        }
        position++;
      });

      sceneScope.#addBotButton(data.length)

    })

    sceneScope.sys.game.socket.on("leave", function (data) {
      console.log("host player leave party");
      sceneScope.#goToTitle();
    });

    //ask players in game
    sceneScope.sys.game.socket.emit('players', { id: sceneScope.sys.game.currentGameId });
  }

  #addBotButton(nbPlayers){
    const sceneScope = this;
    // if hoster : button add Bot if less than 8 players
    if (sceneScope.sys.game.currentGameId === sceneScope.sys.game.currentUuid) {
      if (typeof sceneScope.addBotButton == "undefined" && nbPlayers < 8 ){
        sceneScope.addBotButton = Graphics.drawButton(sceneScope, { x: sceneScope.cameras.main.centerX - 200, y: 420, height: 50, width: 200 }, Styles.startButton, 'add Bot', Styles.startText, 'add Bot', function () {
          console.log("add bot");
          sceneScope.sys.game.socket.emit('add bot', { id: sceneScope.sys.game.currentGameId });
        });
      }
      if (typeof sceneScope.addBotButton != "undefined" && nbPlayers >= 8){
        sceneScope.addBotButton.destroy()
        sceneScope.addBotButton = undefined;
      }
    }
  }

  #addLinkToGame(){
    var div = document.createElement("div");
    var gameField = document.createElement("input");
    gameField.type="text"
    gameField.id = "gameField";
    gameField.disabled = "disabled"
    gameField.value = document.URL + "?g="+ this.sys.game.currentGameId;
    gameField.style="font-size: 32px"
    div.appendChild(gameField);
    
    var copyButton = document.createElement("input");
    copyButton.type="button"
    copyButton.id = "copyButton";
    copyButton.value="copy game's url"
    copyButton.style="font-size: 32px"
    div.appendChild(copyButton);

    var element = this.add.dom(this.cameras.main.worldView.x + this.cameras.main.width / 2, this.cameras.main.worldView.y + this.cameras.main.height - 100, div);

    element.addListener("click");

    element.on("click", (event) => {
      if (event.target.id === 'copyButton'){
        console.log("WaitingScene.#addLinkToGame + copyButton" + document.getElementById("gameField").value);
        navigator.clipboard.writeText(document.getElementById("gameField").value)
      }
    });
  }

  #goToTitle(){
    console.log("WaitingScene.#goToTitle");
    this.sys.game.socket.off("players");
    this.sys.game.socket.off("leave");
    this.addBotButton = undefined;
    this.scene.start('TitleScene');
  }
}

export default WaitingScene;
