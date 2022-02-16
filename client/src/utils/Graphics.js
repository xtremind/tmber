const drawPopup = function(scene) {
  var container = scene.add.container();

  var rectangle = scene.add.graphics();

  rectangle.lineStyle(2, 0x0000FF, 1);
  rectangle.fillStyle(0x027a71, 1);
  rectangle.fillRoundedRect( 0, 0, scene.cameras.main.width, scene.cameras.main.height, 7);
  container.add(rectangle);

  return container;
}


 const drawButton = function (
  scene,
  btnDefinition,
  btnStyle,
  text,
  textStyle,
  btnName,
  callback
) {
  var container = scene.add.container();

  var rectangle = scene.add.graphics();

  rectangle.lineStyle(btnStyle.bSize, btnStyle.bColor, btnStyle.bAlpha);
  rectangle.fillStyle(btnStyle.fColor, btnStyle.fAlpha);
  rectangle.fillRoundedRect(
    btnDefinition.x,
    btnDefinition.y,
    btnDefinition.width,
    btnDefinition.height,
    btnStyle.radius
  );
  rectangle.strokeRoundedRect(
    btnDefinition.x + 3,
    btnDefinition.y + 3,
    btnDefinition.width - 6,
    btnDefinition.height - 6,
    btnStyle.radius - 2
  ); // x, y, width, height, radius
  if (callback !== null) {
    var rect = new Phaser.Geom.Rectangle(
      btnDefinition.x,
      btnDefinition.y,
      btnDefinition.width,
      btnDefinition.height
    );
    rectangle.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
    rectangle.input.cursor = "pointer";
    rectangle.on("pointerdown", callback);
  }
  container.add(rectangle);

  var textElement = scene.add.text(
    btnDefinition.x + btnDefinition.width / 2,
    btnDefinition.y + btnDefinition.height / 2,
    text,
    textStyle
  );
  textElement.setOrigin(0.5);

  container.add(textElement);

  return container;
};

const showError = function (scene, error){
  console.log("Graphics.showError: " + error);
  var errorMessage = scene.add.text(scene.cameras.main.worldView.x + scene.cameras.main.width / 2, 50, error, { font: '32px Courier bold', fill: '#FF5733' });
  errorMessage.setOrigin(0.5);
  errorMessage.setAlpha(0);

  scene.tweens.add({
    targets: errorMessage,
    alpha: 1,
    delay: 0,
    duration: 1000,
    onComplete : () => {
      scene.tweens.add({
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

const blink = function (scene, element, easing = 'Linear', overallDuration = 500, visiblePauseDuration = 125){
  
  let flashDuration = overallDuration - visiblePauseDuration / 2;

  scene.tweens.timeline({
    tweens: [
        {
            targets: element,
            duration: visiblePauseDuration,
            alpha: 1,
            ease: easing
        },
        {
            targets: element,
            duration: flashDuration,
            alpha: 0,
            ease: easing
        },
        {
            targets: element,
            duration: flashDuration,
            alpha: 1,
            ease: easing,
            onComplete: () => {
                if (element.repeat === true) {
                    this.blink(scene, element);
                }
            }
        },
    ]
  });
}

const del = function(container){
  container.destroy();
  return null;
}

export default {
    drawButton,
    del,
    showError,
    blink,
    drawPopup
}
