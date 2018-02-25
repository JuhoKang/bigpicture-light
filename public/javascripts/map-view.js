/* global fabric:true
  document:true
  $:true
  window:true
  canvas:true
  */

const mapCanvas = new fabric.StaticCanvas("map", {
  isDrawingMode: false,
});

var Cross = fabric.util.createClass(fabric.Object, {
  objectCaching: false,
  initialize: function (options) {
    this.callSuper("initialize", options);
    this.animDirection = "up";

    this.width = 20;
    this.height = 20;

    this.w1 = this.h2 = 20;
    this.h1 = this.w2 = 2;
  },

  animateWidthHeight: function () {
    var interval = 2;

    if (this.h2 >= 1 && this.h2 <= 20) {
      var actualInterval = (this.animDirection === "up" ? interval : -interval);
      this.h2 += actualInterval;
      this.w1 += actualInterval;
    }

    if (this.h2 >= 20) {
      this.animDirection = "down";
      this.h2 -= interval;
      this.w1 -= interval;
    }
    if (this.h2 <= 2) {
      this.animDirection = "up";
      this.h2 += interval;
      this.w1 += interval;
    }
  },

  _render: function (ctx) {
    ctx.fillRect(-this.w1 / 2, -this.h1 / 2, this.w1, this.h1);
    ctx.fillRect(-this.w2 / 2, -this.h2 / 2, this.w2, this.h2);
  },
});

mapCanvas.setWidth(128);
mapCanvas.setHeight(128);

function moveMapPointer(x, y) {
  //mapCanvas.clear();
  //mapX = (x / 131072) * 150;
  //mapY = (y / 131072) * 150;
  //mapCanvas.add(new Cross({ top: mapY, left: mapX }));
  //mapCanvas.setBackgroundColor('rgba(255,255,255,1)', mapCanvas.renderAll.bind(mapCanvas));
  //console.log(text);
  coordText.setText(`(${chunk.x / 4096},${chunk.y / 4096})`);
  mapCanvas.renderAll();
  //mapCanvas.add(text);
}

function navigateMap(x, y) {
  if (isPanning === true) {
    mapCanvas.relativePan(new fabric.Point((x - beforePoint.x) / (canvas.getZoom() * 64), (y - beforePoint.y) / (canvas.getZoom() * 64)));
    //console.log((x - beforePoint.x)/(canvas.getZoom()*4096));
    group.set("left", mapCanvas.vptCoords.tl.x + 54);
    group.set("top", mapCanvas.vptCoords.tl.y + 54);
  }
}

pngChunks = {};

function fetchPng(x, y, size) {
  socket.emit("getPng", { xAxis: x, yAxis: y, size: size });
}


socket.on("pngHit", (data) => {
  //console.log("hit");
  pngChunks[`${data.x},${data.y}`] = data.pngData;
  const png = pngChunks[`${data.x},${data.y}`];

  fabric.Image.fromURL(`data:image/png;base64,${png}`, (oImg) => {
    oImg.left += (data.x - startPoint.x) / 64;
    oImg.top += (data.y - startPoint.y) / 64;
    mapCanvas.add(oImg);
  });
});

mapPngs = {};

function fetchMapPngs(x, y) {
  //checking 3*3 of pngs(center is x,y)
  for (let i = x - CANVAS_SIZE; i <= x + CANVAS_SIZE; i += CANVAS_SIZE) {
    for (let j = x - CANVAS_SIZE; j <= x + CANVAS_SIZE; j += CANVAS_SIZE) {
      if (mapPngs[`${i},${j}`] !== true) {
        //console.log(`mapPNG checking : ${i},${j}`);
        fetchPng(i, j, 64);
        mapPngs[`${i},${j}`] = true;
      }
    }
  }
}

function reflectZoomOnMap() {
  zoomText.setText(`[${canvas.getZoom().toFixed(2)}]`);
}
const cross = new Cross({ top: 54, left: 54 });
const coordText = new fabric.Text(`(${chunk.x / 4096},${chunk.y / 4096})`, { top: 75, left: 75 + 10, fontSize: 10 });
const zoomText = new fabric.Text(`[${canvas.getZoom().toFixed(2)}]`, { top: 85, left: 75 + 10, fontSize: 10 });
const group = new fabric.Group([cross, coordText, zoomText]);
function mapInit() {
  fetchMapPngs(chunk.x, chunk.y);
  mapCanvas.relativePan(new fabric.Point(64 + (randomPanX / (canvas.getZoom() * 64)), 64 + (randomPanY / (canvas.getZoom() * 64))));
  
  mapCanvas.add(group);
  mapCanvas.setBackgroundColor("rgba(255,255,255,1)", mapCanvas.renderAll.bind(mapCanvas));
  group.set("left", mapCanvas.vptCoords.tl.x + 54);
  group.set("top", mapCanvas.vptCoords.tl.y + 54);
  mapCanvas.renderAll();
}
//mapCanvas.add(cross);

//const curCenterX = ((canvas.vptCoords.tr.x + canvas.vptCoords.tl.x) / 2) + startPoint.x;
//const curCenterY = ((canvas.vptCoords.bl.y + canvas.vptCoords.tl.y) / 2) + startPoint.y;
//moveMapPointer(curCenterX, curCenterY);
/*function getCurCenter() {
  const curCenterX = (canvas.vptCoords.tr.x + canvas.vptCoords.tl.x) / 2;
  const curCenterY = (canvas.vptCoords.bl.y + canvas.vptCoords.tl.y) / 2;
  // console.log(`curCenter : ${curCenterX+startPoint.x},${curCenterY+startPoint.y}`);
}*/
mapInit();
