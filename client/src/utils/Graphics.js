
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

const del = function(container){
  container.destroy();
  return null;
}

export default {
    drawButton,
    del
}
