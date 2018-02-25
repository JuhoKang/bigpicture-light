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
  coordText.setText(`(${chunk.x / 4096},${chunk.y / 4096})`);
  mapCanvas.renderAll();
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

socket.on("receivePing", (ping) => {
  if(isInsideMap(ping.x, ping.y)) {
    createPingAnimation((ping.x - startPoint.x - mapCanvas.vptCoords.tl.x) / 64, (ping.y - startPoint.y - mapCanvas.vptCoords.tl.y) / 64, ping.type);
  }
  //console.log(ping);
});

//check if virtual coord x,y is inside the map
function isInsideMap(x, y) {
  if (startPoint.x + (mapCanvas.vptCoords.tl.x) * 64 < x && x < startPoint.x + (mapCanvas.vptCoords.tr.x * 64) &&
    startPoint.y + (mapCanvas.vptCoords.tl.y) * 64 < y && y < startPoint.y + (mapCanvas.vptCoords.bl.y) * 64) {
    return true;
  } else {
    return false;
  }
}

const DRAW_FILL_CENTER = "#F44336";
const DRAW_FILL_WAVE = "#FFCDD2";
const CHAT_FILL_CENTER = "#FFEB3B";
const CHAT_FILL_WAVE = "#FFF9C4";
const DEFAULT_FILL_CENTER = "#2196F3";
const DEFAULT_FILL_WAVE = "#BBDEFB";

function createPingAnimation(x, y, type) {
  let innerCircle;
  let outerCircle;
  if (type == "draw") {
    innerCircle = new fabric.Circle({ radius: 5, fill: DRAW_FILL_CENTER, left: x, top: y, originX: "center", originY: "center" });
    outerCircle = new fabric.Circle({ radius: 5, fill: DRAW_FILL_WAVE, left: x, top: y, originX: "center", originY: "center" });
  } else if (type == "chat") {
    innerCircle = new fabric.Circle({ radius: 5, fill: CHAT_FILL_CENTER, left: x, top: y, originX: "center", originY: "center" });
    outerCircle = new fabric.Circle({ radius: 5, fill: CHAT_FILL_WAVE, left: x, top: y, originX: "center", originY: "center" });
  } else {
    innerCircle = new fabric.Circle({ radius: 5, fill: DEFAULT_FILL_CENTER, left: x, top: y, originX: "center", originY: "center" });
    outerCircle = new fabric.Circle({ radius: 5, fill: DEFAULT_FILL_WAVE, left: x, top: y, originX: "center", originY: "center" });
  }

  outerCircle.centeredScaling = true;
  mapCanvas.add(outerCircle);
  outerCircle.animate('radius', 15, {
    onChange: mapCanvas.renderAll.bind(mapCanvas),
    duration: 1000,
  });
  mapCanvas.add(innerCircle);
  setTimeout(function () { mapCanvas.fxRemove(innerCircle) }, 1200);
  setTimeout(function () { mapCanvas.fxRemove(outerCircle) }, 1200);
}

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

mapInit();
