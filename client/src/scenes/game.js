// External Modules
import { Scene } from "phaser";

// Internal Modules
import Graphics from "utils/Graphics";
import Styles from "utils/Styles";
import Action from 'commons/entities/Action'
import difficulty from 'commons/configuration/difficulties.json';


class GameScene extends Scene {
  
  #players = new Map();
  #scores= new Map();
  #hand = [];
  #discard = [];
  #others = [];

  #currentAction = Action.WAIT;
  #separateSpace = 35;
  #centerX;
  #centerY;
  
  #displayedElements = new Map();

  constructor() {
    super({
      key: 'GameScene'
    });
  }

  create() {
    console.log("GameScene.create");
    this.#centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    this.#centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
    this.#displayedElements = new Map();
    this.#createBoard()
    this.#addListener()
    if(this.sys.game.reconnect){
      this.sys.game.socket.emit('reconnect');
    } else {
      this.sys.game.socket.emit('ready');
    }
  }

  #createBoard(){
    console.log("GameScene.#createBoard");
    const sceneScope = this;
    //add background image
    let back = sceneScope.add.image(0, 0, "cardTable").setOrigin(0);
    this.#add('background', back);
  }

  #prepareScore(scores){
    console.log("GameScene.#prepareScore", scores);
    if (typeof scores == "undefined") return ;
    scores.forEach(p => {
      this.#scores.set(p.uuid, p.score);
    });
  }

  #showHand(cards){
    console.log("GameScene.#showHand", cards);
    var sceneScope = this;
    if (typeof cards !== "undefined") this.#hand = cards;
    this.#destroyAll('resultBoard');
    this.#destroyAll('hand');
    const posX = this.#centerX - ((this.#hand.length - 1) * this.#separateSpace)/2;
    this.#hand.forEach((card, index) => {
      let image = this.add.image(posX + this.#separateSpace * (index /* +1 */), this.cameras.main.height - (card.selected ? 100 : 50), 'cards', card.name);
      
      image.setInteractive();
      image.addListener('pointerdown',() => {
        if (sceneScope.#currentAction == Action.DISCARD){
          console.log("select", card);
          card.selected = (!card.selected);
          sceneScope.#showHand();
        } else {
          console.log("bad action"); 
        }
      });
      this.#add('hand', image);
    });

    this.#showScore();
    this.#showTimberButton();
    this.#showDiscardButton()
  }

  #showScore(){
    console.log("GameScene.#showScore");
    this.#destroyAll('score');
    let posX = this.cameras.main.worldView.x + this.cameras.main.width;
    let posY = this.cameras.main.worldView.y + this.cameras.main.height;
    let score = this.add.text(posX - 25, posY - 20, this.#scores.get(this.sys.game.currentUuid), Styles.playerNameText).setOrigin(1, 1);
    this.#add('score', score);
  }

  #showOthers(others){
    console.log("GameScene.#showOthers", others);
    if (typeof others !== "undefined") this.#others = others;
    this.#destroyAll('others');

    const nbOthers = this.#others.length;
    const myIndex = this.#others.findIndex(el => el.uuid == this.sys.game.currentUuid);
    const angle = ((360 / nbOthers) * Math.PI) / 180

    for(let i = 0; i < nbOthers - 1; i++){
      let other = this.#others[((i + 1 + myIndex) % nbOthers)]
      let posX = this.#centerX - 500 * Math.sin(angle*(i+1));
      let posY = this.#centerY + 300 * Math.cos(angle*(i+1));
      
      //display player's nb cards
      for( let j = 0; j < other.nb; j++){
        this.#add('others', this.add.image(posX + j * 10, posY - j * 10, 'cards', 'back'));
      }

      //display player's name and score
      let name = this.add.text(posX, posY + 100, this.#players.get(other.uuid).name.substring(0, 15) + " (" + this.#scores.get(other.uuid) + ")", Styles.playerNameText).setOrigin(0.5, 0);
      this.#blink(name, this.#players.get(other.uuid).current);
      this.#add('others', name);
    }
  }

  #showDiscard(discard){
    console.log("GameScene.#showDiscard", discard);
    var sceneScope = this;
    if (typeof discard !== "undefined") this.#discard = discard;
    this.#destroyAll('discard');

    this.#discard.forEach((card, index) => {
      let image = this.add.image(this.#centerX + 100 + this.#separateSpace * (index /* +1 */), this.#centerY - (card.selected ? 50 : 0), 'cards', card.name);
      image.setInteractive();
      image.addListener('pointerdown',() => {
        if (sceneScope.#currentAction == Action.PICKUP){
          console.log("pick ", card) 
          sceneScope.#currentAction = Action.WAIT;
          sceneScope.#blink(sceneScope.#displayedElements.get('background')[0], false);
          sceneScope.sys.game.socket.emit("pick", card);
        } else {
          console.log("bad action"); 
        }
      })
      this.#add('discard', image);
    });
  }

  #showDraw(draw){
    console.log("GameScene.#showDraw");
    this.#destroyAll('draw');
    var sceneScope = this;
    if (draw.size == 0)
      return;
    let size = Math.floor(draw.size * 5 / 54) ;
    for(let i = 0; i < size; i++){
      let image = this.add.image(this.#centerX - (100 - i*4), this.#centerY+ (8 - i*4) , 'cards', 'back')
      this.#add('draw', image);
    }
    let image = this.add.image(this.#centerX - (100 - size*4), this.#centerY+(8 - size*4), 'cards', 'back')
      .setInteractive()
      .addListener('pointerdown',() => {
        if (sceneScope.#currentAction == Action.PICKUP){
          console.log("draw"); 
          sceneScope.#currentAction = Action.WAIT;
          sceneScope.#blink(sceneScope.#displayedElements.get('background')[0], false);
          sceneScope.sys.game.socket.emit("draw");
        } else {
          console.log("bad action"); 
        }
      }) //=> only that one will have a listener
      this.#add('draw', image);
  }

  #showTimberButton(){
    console.log("GameScene.#showTimberButton");
    this.#destroyAll('tmberButton');
    var sceneScope = this;

    if(sceneScope.#currentAction == Action.PICKUP && this.#hand.reduce((p, c) => p + c.value, 0) <= difficulty.normal.maxTmber){
      let tmberButton = Graphics.drawButton(sceneScope,
        {x: this.#centerX - 160, y: this.cameras.main.height - 275, height: 50, width: 150,},
        Styles.hostButton, "tmber", Styles.hostText, "tmber",
        () => {
          console.log("GameScene.#showTimberButton");
          if (sceneScope.#currentAction == Action.PICKUP){
            sceneScope.#currentAction = Action.WAIT;
            sceneScope.#blink(sceneScope.#displayedElements.get('background')[0], false);
            sceneScope.sys.game.socket.emit("tmber");
          } else {
            console.log("bad action"); 
          }
        }
      );
      
      this.#add('tmberButton', tmberButton);
    }
  }

  #showDiscardButton(){
    console.log("GameScene.#showDiscardButton");
    this.#destroyAll('discardButton');
    var sceneScope = this;

    //if at least 1 selected, display discard button
    if(this.#hand.some(card => card.selected) && sceneScope.#currentAction == Action.DISCARD){
      let discardButton = Graphics.drawButton(sceneScope,
        {x: this.#centerX + 10, y: this.cameras.main.height - 275, height: 50, width: 150,},
        Styles.hostButton, "discard", Styles.hostText, "discard",
        () => {
          console.log("GameScene.#showDiscardButton - discard");
          if (sceneScope.#currentAction == Action.DISCARD){
            sceneScope.#currentAction = Action.WAIT;
            sceneScope.#blink(sceneScope.#displayedElements.get('background')[0], false);
            sceneScope.sys.game.socket.emit("discard", sceneScope.#hand.filter(card => card.selected).map(card => {return {"name":card.name}}));
          } else {
            console.log("bad action"); 
          }
        }
      );
      
      this.#add('discardButton', discardButton);
    }
  }

  #showResult(result){
    console.log("GameScene.#showResult");
    
    var resultBoard = Graphics.drawPopup(this);
    
    const nbPlayers = result.scores.length;
    const myIndex = result.scores.findIndex(el => el.uuid == this.sys.game.currentUuid);
    const angle = ((360 / nbPlayers) * Math.PI) / 180

    for(let i = 0; i < nbPlayers; i++){
      let player = result.scores[((i + 1 + myIndex) % nbPlayers)]
      let posX = this.#centerX - 450 * Math.sin(angle*(i+1));
      let posY = this.#centerY - 20 + 250 * Math.cos(angle*(i+1));
      
      //display player's nb cards
      for( let j = 0; j < player.cards.length; j++){
        let card =  this.add.image(posX + j * 15, posY, 'cards', player.cards[j].name).setAngle((-Math.floor((player.cards.length * 15)/2)) + j * 15);
        resultBoard.add(card);
      }

      //display player's name and result
      let name = this.add.text(posX, posY + 110, player.name, Styles.playerNameText).setOrigin(0.5, 0)
      let score = this.add.text(posX, posY + 140, player.result, Styles.playerNameText).setOrigin(0.5, 0)

      //if player tmber, blink
      if(player.tmber){
        this.#blink(name, true)
        this.#blink(score, true)
      }

      resultBoard.add(name);
      resultBoard.add(score);

    }

    //add sound
    
    this.#add('resultBoard', resultBoard);
  }

  #addListener(){
    console.log("GameScene.#addListener");
    var sceneScope = this;
    
    sceneScope.sys.game.socket.on("players", players => players.forEach(player => sceneScope.#players.set(player.uuid, player)));
    sceneScope.sys.game.socket.on("score", scores => sceneScope.#prepareScore(scores));
    sceneScope.sys.game.socket.on("cards", cards => sceneScope.#showHand(cards));
    sceneScope.sys.game.socket.on("others", others => sceneScope.#showOthers(others));
    sceneScope.sys.game.socket.on("discard", discarded => sceneScope.#showDiscard(discarded));
    sceneScope.sys.game.socket.on("draw", draw => sceneScope.#showDraw(draw));
    sceneScope.sys.game.socket.on("pick?", error => sceneScope.#doAction(Action.PICKUP, error))
    sceneScope.sys.game.socket.on("discard?", error => sceneScope.#doAction(Action.DISCARD, error));
    sceneScope.sys.game.socket.on("result", result => sceneScope.#showResult(result));
    sceneScope.sys.game.socket.on("end", () => sceneScope.#goToEndGame());
  }

  #doAction(action, error){
    this.#blink(this.#displayedElements.get('background')[0], true);
    this.#currentAction = action; 
    this.#showHand();
    if (typeof error != "undefined"){
      Graphics.showError(this, error.message);
    }
  }

  #goToEndGame(){
    console.log("GameScene.#goToEndGame");
    this.#removeListeners();
    this.scene.start('EndScene');
  }

  #removeListeners(){
    console.log("GameScene.#removeListeners");
    this.sys.game.socket.off("players");
    this.sys.game.socket.off("score");
    this.sys.game.socket.off("cards");
    this.sys.game.socket.off("others");
    this.sys.game.socket.off("discard");
    this.sys.game.socket.off("draw");
    this.sys.game.socket.off("pick?");
    this.sys.game.socket.off("discard?");
    this.sys.game.socket.off("result");
    this.sys.game.socket.off("end");
  }

  #add(id, element){
    let elements = this.#displayedElements.get(id)
    if(typeof elements == "undefined" || elements.length == 0)
      elements = []
    elements.push(element);
    this.#displayedElements.set(id, elements)
  }

  #blink(element, active){
    if(active){
      element.repeat = true;
      Graphics.blink(this, element)
    } else {
      element.repeat=false
    }
  }

  #destroyAll(id){
    let elements = this.#displayedElements.get(id);
    if(typeof elements == "undefined")
      return;
    elements.forEach(element => element.destroy())
  }

}

export default GameScene;