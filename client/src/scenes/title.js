// External Modules
import {Scene} from 'phaser';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie'

// Internal Modules
import Styles from 'utils/Styles';

class TitleScene extends Scene {
    constructor() {
      super({
        key: 'TitleScene'
      });
    }
    
    create() {
      console.log("TitleScene.create");
      const sceneScope = this;
      
      //add background image
      sceneScope.add.image(0, 0, 'cardTable').setOrigin(0);

      //add title
      const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
      const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
      sceneScope.add.text(screenCenterX, 100, '♥ ♣  Tmber  ♠ ♦', Styles.titleText).setOrigin(0.5);

      let id = Cookies.get('uuid');

      if (typeof id == 'undefined') {
        id = uuidv4();
        Cookies.set('uuid', id)
      }
      console.log("TitleScene.create - id : " + id);

      this.sys.game.socket.emit("identify", {uuid: id})
    }

  }
  
  export default TitleScene;