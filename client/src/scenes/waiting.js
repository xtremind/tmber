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
    this.#createBoard();
    this.#addListeners()

    //ask players in game
    this.sys.game.socket.emit('players', { id: this.sys.game.currentGameId });
  }

  #createBoard(){
    console.log("WaitingScene.#createBoard");
    const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;

    //add background image
    this.add.image(0, 0, "cardTable").setOrigin(0);
    
    //add title
    this.add
      .text(screenCenterX, 100, "♥ ♣  Tmber  ♠ ♦", Styles.titleText)
      .setOrigin(0.5);

    // add a subtitle
    this.add
      .text(screenCenterX, 200, this.sys.game.currentHostname + '\'s Game', Styles.subtitleText)
      .setOrigin(0.5);
      
    this.#addLinkToGame();
    this.#addLeaveButton()

  }

  #addLinkToGame(){
    console.log("WaitingScene.#addLinkToGame");
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
        console.log("WaitingScene.#addLinkToGame - copyButton " + document.getElementById("gameField").value);
        navigator.clipboard.writeText(document.getElementById("gameField").value)
      }
    });
  }

  #addLeaveButton(){
    console.log("WaitingScene.#addLeaveButton");
    const sceneScope = this;
    const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    Graphics.drawButton(sceneScope,
      {x: screenCenterX - 200, y: 280, height: 50,width: 200,},
      Styles.hostButton, "leave game", Styles.hostText, "leave game",
      () => {
        console.log("WaitingScene.create - player leave party");
        sceneScope.sys.game.socket.emit("leave", {id: sceneScope.sys.game.currentGameId,});
        sceneScope.#goToTitle();
      }
    );
  }

  #addListeners(){
    console.log("WaitingScene.#addListener");
    const sceneScope = this;
    //add listeners
    sceneScope.sys.game.socket.on("players", function (data) {
      console.log("WaitingScene.create - refresh list of players in the game");
      sceneScope.#cleanPlayers()
      sceneScope.#cleanBots();
      var position = 0;

      // create new join List
      data.forEach(function (player) {
        sceneScope.#showPlayer(player, position++);
      });

      sceneScope.#addBotButton(data.length)

    })

    sceneScope.sys.game.socket.on("leave", function (data) {
      console.log("WaitingScene.create - host player leave party");
      sceneScope.#goToTitle();
    });
  }

  #showPlayer(player, position){
    console.log("WaitingScene.#showPlayer - "+ player.id);
    const sceneScope = this;
    sceneScope.playersList[player.id] = sceneScope.add.text(sceneScope.cameras.main.centerX + 100, 235 + 50 * position, player.name, Styles.playerNameText)
    if(sceneScope.sys.game.currentGameId === sceneScope.sys.game.currentUuid && !player.isPlayer){
      sceneScope.botsList[player.id] = Graphics.drawButton(sceneScope, { x: sceneScope.cameras.main.centerX + 300, y: 230 + 50 * position, height: 40, width: 200 }, Styles.startButton, 'Remove', Styles.startText, 'Remove', function () {
        console.log("WaitingScene.create - remove bot");
        sceneScope.sys.game.socket.emit('remove bot', { id: player.id });
      });
    }
  }

  #cleanPlayers(){
    console.log("WaitingScene.#cleanPlayers");
    for (var key in this.playersList) {
      this.playersList[key].destroy();
    }
    this.playersList = [];
  }

  #cleanBots(){
    console.log("WaitingScene.#cleanBots");
    for(var key in this.botsList) {
      this.botsList[key].destroy();
    }      
    this.botsList = [];
  }

  #addBotButton(nbPlayers){
    console.log("WaitingScene.#addBotButton");
    const sceneScope = this;
    // if hoster : button add Bot if less than 8 players
    if (sceneScope.sys.game.currentGameId === sceneScope.sys.game.currentUuid) {
      if (typeof sceneScope.addBotButton == "undefined" && nbPlayers < 8 ){
        sceneScope.addBotButton = Graphics.drawButton(sceneScope, { x: sceneScope.cameras.main.centerX - 200, y: 420, height: 50, width: 200 }, Styles.startButton, 'add Bot', Styles.startText, 'add Bot', function () {
          console.log("WaitingScene.create - add bot");
          sceneScope.sys.game.socket.emit('add bot', { id: sceneScope.sys.game.currentGameId });
        });
      }
      if (typeof sceneScope.addBotButton != "undefined" && nbPlayers >= 8){
        sceneScope.addBotButton.destroy()
        sceneScope.addBotButton = undefined;
      }
    }
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
