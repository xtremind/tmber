// External Modules
import { Scene } from "phaser";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";

// Internal Modules
import Graphics from "utils/Graphics";
import Styles from "utils/Styles";

class TitleScene extends Scene {
  constructor() {
    super({
      key: "TitleScene",
    });
  }

  create() {
    console.log("TitleScene.create");
    this.#createBoard();
    this.#addListener();
    this.sys.game.socket.emit('games', {});    
    this.#redirectToGame()
  }


  #createBoard(){
    console.log("TitleScene.#createBoard");
    const sceneScope = this;
    //add background image
    sceneScope.add.image(0, 0, "cardTable").setOrigin(0);

    //add title
    const screenCenterX =
      sceneScope.cameras.main.worldView.x + sceneScope.cameras.main.width / 2;
    sceneScope.add
      .text(screenCenterX, 100, "♥ ♣  Tmber  ♠ ♦", Styles.titleText)
      .setOrigin(0.5);

    sceneScope.#displayNameField()


    //add rounded buttons
    Graphics.drawButton(sceneScope,
      {x: sceneScope.cameras.main.width * 0.5 - 200, y: 280, height: 50,width: 200,},
      Styles.hostButton, "host game", Styles.hostText, "host game",
      () => {
        sceneScope.sys.game.socket.emit("host", {name: document.getElementById("nameField").value,});
      }
    );
  }

  #displayNameField(){
    console.log("TitleScene.#displayNameField");
    var sceneScope = this;
    let cookie = Cookies.get("tmber");
    let id, name;

    if (typeof cookie == "undefined") {
      id = uuidv4();
      name = "Player_" + id.substring(0, 6);
      Cookies.set("tmber", JSON.stringify({ id, name }));
    } else {
      id = JSON.parse(cookie).id;
      name = JSON.parse(cookie).name;
    }

    sceneScope.sys.game.socket.emit("identify", { uuid: id });
    sceneScope.sys.game.currentUuid = id;

    sceneScope.#addNameField(id, name);
  }

  #addListener(){
    console.log("TitleScene.#addListener");
    var sceneScope = this;
    //add listeners
    sceneScope.sys.game.socket.on("joined", (party) => {
      sceneScope.#gameJoined(party);
    });

    sceneScope.sys.game.socket.on("error", (data) => {
      sceneScope.#showError(data.message);
    });

    sceneScope.sys.game.socket.on("games", (parties) => {
      sceneScope.#clearGames()
      var position = 0;

      // create new join List
      parties.forEach((party) => {
        sceneScope.#showGame(party, ++position)
      });
    });
  }
  
  #clearGames(){
    console.log("TitleScene.#clearGames");
    for (var key in this.gameList) {
      Graphics.del(this.gameList[key]);
    }

    this.gameList = [];
  }
  
  #showGame(party, position){
    console.log("TitleScene.#showGame - " + party.id);
    var sceneScope = this;
    sceneScope.gameList[party.id] = Graphics.drawButton(sceneScope, { x: sceneScope.cameras.main.centerX+ 50, y: 210 + 70 * position, height: 50, width: 200 }, Styles.joinButton, 'join game', Styles.joinText, 'join game', 
    () => {
      //sceneScope.sys.game.playerName = playerName.value;
      console.log("TitleScene.#showGame - join game " + party.id);
      sceneScope.sys.game.socket.emit('join', { id: party.id, name: document.getElementById("nameField").value });
    });
  }

  #gameJoined(party) {
    console.log("TitleScene.#gameJoined - game joined " + party.id);
    this.sys.game.socket.off("games");
    this.sys.game.socket.off("joined");
    this.sys.game.socket.off("error");
    this.sys.game.currentGameId = party.id;
    this.sys.game.currentHostname = party.hostname;
    this.gameList = [];
    this.scene.start('WaitingScene'); 
  }

  #addNameField(id, name){
    var inputText = document.createElement("input");
    inputText.placeholder = "Enter your name";
    inputText.id = "nameField";
    inputText.value = name;
    inputText.style="font-size: 32px"

    var element = this.add.dom(this.cameras.main.worldView.x + this.cameras.main.width / 2, 200, inputText);

    element.addListener("input");

    element.on("input", () => {
      console.log("TitleScene.#addNameFiel - input : " + document.getElementById("nameField").value);
      Cookies.set("tmber", JSON.stringify({ id, name: document.getElementById("nameField").value })
      );
    });
  }

  #goToGame(urlParams){
    var id = urlParams.get('g');
    console.log("TitleScene.#goToGame - join game " + id);
    this.sys.game.leaving = true;
    this.sys.game.socket.emit('join', { id: id, name: document.getElementById("nameField").value });
  }

  #showError(message){
    console.log("TitleScene.#showError - error " + message);
    var errorMessage = this.add.text(this.cameras.main.worldView.x + this.cameras.main.width / 2, 50, message, { font: '32px Courier bold', fill: '#FF5733' });
    errorMessage.setOrigin(0.5);
    errorMessage.setAlpha(0);

    this.tweens.add({
        targets: errorMessage,
        alpha: 1,
        delay: 0,
        duration: 1000,
        onComplete : () => {
          this.tweens.add({
            targets: errorMessage,
            alpha: 0,
            delay: 2000,
            duration: 1000,
            onComplete : () => {
              errorMessage.destroy()
            }
        });
        }
    });
  }

  #redirectToGame(){
    console.log("TitleScene.#redirectToGame");
    //detect if join game
    const urlParams = new URLSearchParams(window.location.search);

    if(urlParams.has('g') && !this.sys.game.leaving){
      this.#goToGame(urlParams);
    }
  }

}

export default TitleScene;
