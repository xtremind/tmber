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
    const sceneScope = this;

    //add background image
    sceneScope.add.image(0, 0, "cardTable").setOrigin(0);

    //add title
    const screenCenterX =
      sceneScope.cameras.main.worldView.x + sceneScope.cameras.main.width / 2;
    const screenCenterY =
      sceneScope.cameras.main.worldView.y + sceneScope.cameras.main.height / 2;
    sceneScope.add
      .text(screenCenterX, 100, "♥ ♣  Tmber  ♠ ♦", Styles.titleText)
      .setOrigin(0.5);

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

    var inputText = document.createElement("input");
    inputText.placeholder = "Enter your name";
    inputText.id = "nameField";
    inputText.value = name;

    var element = sceneScope.add.dom(screenCenterX, 200, inputText);

    element.addListener("input");

    element.on("input", function (event) {
      console.log("TitleScene.create - input : " + document.getElementById("nameField").value);
      Cookies.set( "tmber", JSON.stringify({ id, name: document.getElementById("nameField").value })
      );
    });

    sceneScope.sys.game.socket.on("game joined", function (party) {
      sceneScope.gameJoined(party.id);
    });

    //add rounded buttons
    Graphics.drawButton(sceneScope,
      {x: sceneScope.cameras.main.width * 0.5 - 200, y: 280, height: 50,width: 200,},
      Styles.hostButton, "host game", Styles.hostText, "host game",
      function () {
        sceneScope.sys.game.socket.emit("host", {name: document.getElementById("nameField").value,});
      }
    );
  }

  gameJoined(id) {
    console.log("game joined " + id);
    this.sys.game.socket.off("list games");
    this.sys.game.socket.off("game joined");
    this.sys.game.currentGameId = id;
    this.gameList = [];
    this.scene.start('WaitingScene'); 
  }
}

export default TitleScene;
