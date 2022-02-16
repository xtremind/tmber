// External Modules
import { Scene } from "phaser";

// Internal Modules
import Graphics from "utils/Graphics";
import Styles from "utils/Styles";

class EndScene extends Scene {

  constructor() {
    super({
      key: 'EndScene'
    });
  }
  
  create() {
    //
    console.log("EndScene.create");
    this.#showBoard();
    this.#addListeners();
    //show button to main menu
  }

  #showBoard(){
    console.log("EndScene.#showBoard");
    this.add.image(0, 0, "cardTable").setOrigin(0);
    
    //add title
    const screenCenterX =
    this.cameras.main.worldView.x + this.cameras.main.width / 2;
    this.add
      .text(screenCenterX, 100, "♥ ♣  Tmber  ♠ ♦", Styles.titleText)
      .setOrigin(0.5);
  }
  
  #addListeners(){
    console.log("EndScene.#addListeners");
    this.#askRanking();
  }

  #askRanking(){
    console.log("EndScene.#askRanking");
    const sceneScope = this;
    this.sys.game.socket.on("ranks", data => sceneScope.#showRanking(data))
    //reward ...
    this.sys.game.socket.emit('final');
  }
  
  #showRanking(data){
    console.log("EndScene.#showRanking");
    let sceneScope = this
    //console.log(data);
    // let currentRank = -1; // changer la taille de police en fonction du rank
    data.forEach(function (player, index) { // 🏆🥇🥈🥉 
      let medal = player.rank === 1 ? "🏆" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : player.rank;
      sceneScope.add.text(100, 200 + index * 30, medal + " " +player.name, Styles.playerScore)
      sceneScope.add.text(400, 200 + index * 30, player.score, Styles.playerScore) 
    });
  }
}

export default EndScene;