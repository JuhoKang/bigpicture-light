/* global fabric:true
  document:true
  $:true
  window:true
  canvas:true
  */

const mapCanvas = new fabric.StaticCanvas('map', {
  isDrawingMode: false,
});

var Cross = fabric.util.createClass(fabric.Object, {
  objectCaching: false,
  initialize: function(options) {
    this.callSuper('initialize', options);
    this.animDirection = 'up';

    this.width = 10;
    this.height = 10;

    this.w1 = this.h2 = 10;
    this.h1 = this.w2 = 1;
  },

  animateWidthHeight: function() {
    var interval = 2;

    if (this.h2 >= 1 && this.h2 <= 10) {
      var actualInterval = (this.animDirection === 'up' ? interval : -interval);
      this.h2 += actualInterval;
      this.w1 += actualInterval;
    }

    if (this.h2 >= 10) {
      this.animDirection = 'down';
      this.h2 -= interval;
      this.w1 -= interval;
    }
    if (this.h2 <= 1) {
      this.animDirection = 'up';
      this.h2 += interval;
      this.w1 += interval;
    }
  },

  _render: function(ctx) {
    ctx.fillRect(-this.w1 / 2, -this.h1 / 2, this.w1, this.h1);
    ctx.fillRect(-this.w2 / 2, -this.h2 / 2, this.w2, this.h2);
  },
});

mapCanvas.setWidth(150);
mapCanvas.setHeight(150);

function moveMapPointer(x, y) {
  mapCanvas.clear();
  mapX = (x / 131072) * 150;
  mapY = (y / 131072) * 150;
  mapCanvas.add(new Cross({ top: mapY, left: mapX }));
  mapCanvas.setBackgroundColor('rgba(255,255,255,1)', mapCanvas.renderAll.bind(mapCanvas));
  var text = new fabric.Text(`(${chunk.x/4096},${chunk.y/4096})`, { top: mapY, left: mapX + 10, fontSize: 10});
  mapCanvas.add(text);
}

mapCanvas.setBackgroundColor('rgba(255,255,255,1)', mapCanvas.renderAll.bind(mapCanvas));
const curCenterX = ((canvas.vptCoords.tr.x + canvas.vptCoords.tl.x) / 2) + startPoint.x;
const curCenterY = ((canvas.vptCoords.bl.y + canvas.vptCoords.tl.y) / 2) + startPoint.y;
moveMapPointer(curCenterX, curCenterY);
mapCanvas.setBackgroundColor('rgba(255,255,255,1)', mapCanvas.renderAll.bind(mapCanvas));
function getCurCenter() {
  const curCenterX = (canvas.vptCoords.tr.x + canvas.vptCoords.tl.x) / 2;
  const curCenterY = (canvas.vptCoords.bl.y + canvas.vptCoords.tl.y) / 2;
  // console.log(`curCenter : ${curCenterX+startPoint.x},${curCenterY+startPoint.y}`);
}
