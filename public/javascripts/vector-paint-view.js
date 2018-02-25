/* global fabric:true
  document:true
  $:true
  window:true
  Rx:true
  noUiSlider:true
  Huebee:true
  */
const socket = io();
const canvas = new fabric.Canvas('c', {
  isDrawingMode: true,
  stateful: false,
  renderOnAddRemove: false,
  selection: false,
  skipTargetFind: false,
});

//make the canvas objects unselectable
canvas.selection = false;

const CANVAS_SIZE = 4096;
const DRAWABLE_ZOOM_LIMIT = 0.5;
const POPULAR_CHUNK_COORD_START = 10;
const POPULAR_CHUNK_COORD_STOP = 10;

let isRendering = false;
let isAnimating = false;

const render = canvas.renderAll.bind(canvas);
const stop = () => isAnimating = false;
const play = () => {
  isAnimating = true;
  canvas.renderAll();
};

canvas.renderAll = () => {
  if (!isRendering) {
    isRendering = true;
    requestAnimationFrame(() => {
      render();
      isRendering = false;
      if (isAnimating) {
        canvas.renderAll();
      }
    });
  }
};

let chunk = {
  x: CANVAS_SIZE * 10,
  y: CANVAS_SIZE * 10,
};

let startPoint = {
  x: CANVAS_SIZE * 10,
  y: CANVAS_SIZE * 10,
};

var currentChunks = {};

// get Left Top Coordinate
function getLTC(num) {
  if (num >= 0) {
    return num - (num % CANVAS_SIZE);
  } else {
    if (num % CANVAS_SIZE !== 0) {
      return num - (num % CANVAS_SIZE) - CANVAS_SIZE;
    } else {
      return num;
    }
  }
}

//---------------- draw line width slider ----- start
const lineWidthSlider = document.getElementById('drawing-line-width');

noUiSlider.create(lineWidthSlider, {
  start: [1],
  connect: [true, false],
  format: {
    to(value) {
      return Math.round(value);
    },
    from(value) {
      return value;
    },
  },
  range: {
    min: 0,
    max: 60,
  },
});

lineWidthSlider.noUiSlider.on('change', (e) => {
  canvas.freeDrawingBrush.width = parseInt(e, 10) || 1;
  //console.log("change");
  //updatePreview();
});
lineWidthSlider.noUiSlider.on('update', (e) => {
  updatePreviewWidth(parseInt(e, 10) || 1);
  //console.log("uislider update");
});
//---------------- draw line width slider ----- end

fabric.Object.prototype.transparentCorners = false;

function changeModeToDrawingMode() {
  if (canvas.getZoom() < DRAWABLE_ZOOM_LIMIT) {
    changeInfoText("더 줌인 하셔야 그림을 그릴수 있어요!", "shake", "alert-danger");
  } else {
    canvas.isDrawingMode = true;
    canvas.setCursor(canvas.freeDrawingCursor);
  }
}

function changeModeToNavigatingMode() {
  canvas.isDrawingMode = false;
  canvas.defaultCursor = canvas.moveCursor;
}



var hueb = new Huebee('.color-input', {
  notation: 'hex',
  staticOpen: false,
});

hueb.on('change', function (color, hue, sat, lum) {
  canvas.freeDrawingBrush.color = color;
  updatePreviewColor(color);
});

// mobile view

if (canvas.freeDrawingBrush) {
  canvas.freeDrawingBrush.color = '#000000';
  //canvas.freeDrawingBrush.width = parseInt(lineWidthSlider.noUiSlider.get(), 10) || 1;
  canvas.freeDrawingBrush.shadow = new fabric.Shadow({
    blur: parseInt('#000000', 10) || 0,
    offsetX: 0,
    offsetY: 0,
    affectStroke: true,
    color: '#000000',
  });
}

var drawCount = 0;

$(document).keyup(function (event) {
  // console.log(event);
  if (event.keyCode === 90 && event.ctrlKey) {
    // console.log('ctrl z');
    undo();
  }
});

function undo() {
  var objects = canvas.getObjects();
  // console.log(objects);
  if (drawCount > 0) {
    for (var i = objects.length - 1; i > -1; i--) {
      if (objects[i].owner === guid) {
        // console.log('remove');
        // console.log(objects[i]);
        removeFromRemote(objects[i]);
        canvas.remove(objects[i]);
        canvas.renderAll();
        drawCount--;
        break;
      }
    }
  }
}

function removeFromRemote(object) {
  const envelope = {
    xAxis: getLTC(startPoint.x + object.aCoords.tl.x),
    yAxis: getLTC(startPoint.y + object.aCoords.tl.y),
    uid: guid,
  };
  socket.emit('removeObject', envelope);
}

//should Change
function objectOutOfChunk(aCoords) {
  // console.log(aCoords);
  if (aCoords.tl.x + startPoint.x >= chunk.x + CANVAS_SIZE) {
    return true;
  } else if (aCoords.tl.y + startPoint.y >= chunk.y + CANVAS_SIZE) {
    return true;
  } else if (aCoords.br.x + startPoint.x < chunk.x) {
    return true;
  } else if (aCoords.br.y + startPoint.y < chunk.y) {
    return true;
  }
  return false;
}

const guid = uuidv4();

//generate guid
//code from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/2117523#2117523
function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

const onObjectAdded = (e) => {
  if (!e.target.isNotMine) {
    drawCount += 1;
    e.target.selectable = false;
    e.target.owner = guid;
    // console.log(e.target);
    const clonedObj = fabric.util.object.clone(e.target);
    // console.log(`clonedObj.left : ${clonedObj.left} , top : ${clonedObj.top}`);
    clonedObj.owner = guid;
    // console.log(`envelope x : ${getLTC(startPoint.x + e.target.aCoords.tl.x)} , y : ${getLTC(startPoint.y + e.target.aCoords.tl.y)}`);
    const envelope = {
      xAxis: getLTC(startPoint.x + e.target.aCoords.tl.x),
      yAxis: getLTC(startPoint.y + e.target.aCoords.tl.y),
      serverLeft: (startPoint.x + clonedObj.left) - getLTC(startPoint.x + e.target.aCoords.tl.x),
      serverTop: (startPoint.y + clonedObj.top) - getLTC(startPoint.x + e.target.aCoords.tl.y),
      data: clonedObj,
      uid: guid,
    };
    socket.emit('drawToChunk', envelope);
  } else {
    // console.log('object added from other');
  }
};

canvas.on('object:added', onObjectAdded);

/*function fetchChunk(x, y) {
  canvas.off('object:added');
  $.get(`/api/paintchunk/json/coord/${x}/${y}`).then((json) => {
    canvas.clear();
    canvas.absolutePan(new fabric.Point(0, 0));
    canvas.loadFromJSON(json);
    canvas.forEachObject((o) => {
      o.selectable = false;
    });
    canvas.on('object:added', onObjectAdded);
    canvas.renderAll();
  });
  currentChunks[`${x},${y}`] = true;
}*/

function fetchChunk(x, y) {
  socket.emit('getChunkData', { x, y, isMain: true });
}

socket.on('mainChunkSend', (data) => {
  //console.log('mainChunkSend');
  // console.log(data);
  canvas.off('object:added');
  canvas.clear();
  canvas.absolutePan(new fabric.Point(0, 0));
  canvas.loadFromJSON(data.json);
  canvas.forEachObject((o) => {
    o.selectable = false;
  });
  currentChunks[`${data.x},${data.y}`] = true;
  panToRandom();
  canvas.on('object:added', onObjectAdded);
  canvas.renderAll();
});

function fetchOtherChunkSocket(x, y) {
  socket.emit('getChunkData', { x, y, isMain: false });
}

socket.on('otherChunkSend', (data) => {
  const fc = document.createElement('canvas');
  //console.log('otherChunkSend');
  // console.log(data);
  const fetchCanvas = new fabric.Canvas(fc, { renderOnAddRemove: false });
  // console.log(`fetch from ${data.x},${data.y}`);

  canvas.off('object:added');
  if (data.json == null) {
    canvas.on('object:added', onObjectAdded);
    changeInfoText('로딩 완료', 'flash', 'alert-success');
  } else {
    fetchCanvas.loadFromJSON(data.json, () => {
      canvas.renderAll();
      canvas.on('object:added', onObjectAdded);
      // console.log(`fetch done : ${data.x},${data.y}`);
      // changeInfoText('로딩 완료', 'flash', 'alert-success');
    }, (o, object) => {
      object.left += data.x - startPoint.x;
      object.top += data.y - startPoint.y;
      object.isNotMine = true;
      canvas.add(object);
    });

    fetchCanvas.forEachObject((o) => {
      o.isNotMine = true;
      o.selectable = false;
    });
  }
  canvas.on('object:added', onObjectAdded);
});

//fetchChunkFromOther differs with fetchChunk because the current chunk is different with other 
function fetchChunkFromOther(x, y) {
  fetchOtherChunkSocket(x, y);
}

function onResize() {
  canvas.setWidth($('#c').parent().parent().width());
  canvas.setHeight(window.innerHeight - $('#c').offset().top);
}

function joinRoom(x, y) {
  socket.emit('joinRoom', { x, y });
}

function leaveRoom(x, y) {
  socket.emit('leaveRoom', { x, y });
}

const randomPanX = getRandomIntInclusive(-500, -1500);
const randomPanY = getRandomIntInclusive(-500, -1500);

function panToRandom(){
  canvas.relativePan(new fabric.Point(randomPanX, randomPanY));
}

let starttime;

function changeInfoText(message, animateMethod, alertType) {
  $('#infotext').text(message);
  $('#infotext').attr('class', `col-lg-4 col-md-12 col-sm-12 alert ${alertType} btn-block`);
  $('#infotext').animateCss(animateMethod);
}

const onObjectFromOther = (data) => {
  changeInfoText('누군가 그리고있어요!', 'jello', 'alert-info');
  fabric.util.enlivenObjects([data.data], (objects) => {
    objects.forEach((obj) => {
      const fromOther = obj;
      fromOther.isNotMine = true;
      fromOther.selectable = false;
      fromOther.owner = data.uid;
      canvas.add(fromOther);
      canvas.renderAll();
    });
  });
};

socket.on('objectFromOther', onObjectFromOther);

const onUndoFromOther = (uid) => {
  changeInfoText('누군가 그리고있어요!', 'jello', 'alert-info');
  let objects = canvas.getObjects();
  for (var i = objects.length - 1; i > -1; i--) {
    if (objects[i].owner === uid) {
      canvas.remove(objects[i]);
      canvas.renderAll();
      break;
    }
  }
}

socket.on('undoFromOther', onUndoFromOther);

var previewObj = null;

function createPreview(x, y) {
  canvas.off('object:added');
  previewObj = new fabric.Circle({ radius: (canvas.freeDrawingBrush.width / 2), fill: canvas.freeDrawingBrush.color, left: 100, top: 100 });
  canvas.add(previewObj);
  canvas.on('object:added', onObjectAdded);
};

function updatePreviewWidth(width) {
  if(previewObj != null) {
    previewObj.set("radius", width / 2);
    canvas.renderAll();
  }
}

function updatePreviewColor(color) {
  if(previewObj != null) {
    previewObj.fill = color;
    canvas.renderAll();
  }
}

function movePreview(x, y) {
  previewObj.left = x - previewObj.radius;
  previewObj.top = y - previewObj.radius;
}

let isPanning = false;
let beforePoint;

const touchStart = Rx.Observable.fromEvent(canvas, 'touchstart');
const touchMove = Rx.Observable.fromEvent(canvas, 'touchmove');
const touchEnd = Rx.Observable.fromEvent(canvas, 'touchend');
const touchLeave = Rx.Observable.fromEvent(canvas, 'touchleave');

const subscribeTouchStart = touchStart.subscribe((e) => {
  e.preventDefault();
  userNavDown(e.touches[0]);
});
const subscribeTouchMove = touchMove.subscribe((e) => {
  userNavMove(e.touches[0]);
});

const subscribeTouchEnd = touchEnd.subscribe((e) => {
  userNavUp(e.touches[0]);
});

const subscribeTouchLeave = touchLeave.subscribe((e) => {
});

function userNavDown(e) {
  if (!canvas.isDrawingMode) {
    isPanning = true;
    beforePoint = {
      x: e.screenX,
      y: e.screenY,
    };
  }
}

canvas.on('mouse:down', (ew) => {
  if (ew.e instanceof MouseEvent) {
    const clickPoint = canvas.getPointer(ew.e);
    // console.log(`x: ${clickPoint.x + startPoint.x} , y: ${clickPoint.y + startPoint.y}`);
    userNavDown(ew.e);
  } else {
    const clickPoint = canvas.getPointer(ew.e.touches[0]);
    // console.log(`x: ${clickPoint.x + startPoint.x} , y: ${clickPoint.y + startPoint.y}`);
    userNavDown(ew.e.touches[0]);
  }
});

function userNavMove(e) {
  if (isPanning === true) {
    const x = e.screenX;
    const y = e.screenY;
    canvas.relativePan(new fabric.Point(x - beforePoint.x, y - beforePoint.y));
    navigateMap(x, y);
    updateCanvasMove();
    beforePoint.x = x;
    beforePoint.y = y;
  }
}

function mouseHoverPreview(e) {
  let point = canvas.getPointer(e);
  movePreview(point.x, point.y);
  canvas.renderAll();
}

/*canvas.on('mouse:over', (ew) => {
  if (ew.e instanceof MouseEvent) {
    let tempPoint = canvas.getPointer(ew.e);
    if(preview === null) {
      console.log('hello');
      createPreview(tempPoint.x, tempPoint.y);
    } else {
      console.log('hello');
      preview.visible = true;
      updatePreview();
    }    
  } else {
  }
});*/
$(".upper-canvas").mouseout(() => { if (previewObj != null) {
    canvas.remove(previewObj);
    previewObj = null;
    canvas.renderAll();
  }
});
$(".upper-canvas").mouseover((e) => {
  if (canvas.isDrawingMode) {
    let tempPoint = canvas.getPointer(e);
    createPreview(tempPoint.x, tempPoint.y);
  }
});
/*
canvas.on('mouse:out', (ew) => {
  console.log('im out');
  preview.visible = false;
  canvas.renderAll();
});*/

canvas.on('mouse:move', (ew) => {
  //console.log(canvas.getPointer(ew.e));
  if (ew.e instanceof MouseEvent) {
    if (canvas.isDrawingMode) {
      mouseHoverPreview(ew.e);
    } else {
      userNavMove(ew.e);
    }
  } else {
    if (!canvas.isDrawingMode) {
      userNavMove(ew.e.touches[0]);
    }
  }
});

function userNavUp(e) {
  isPanning = false;
  const centerX = (canvas.vptCoords.tr.x + canvas.vptCoords.tl.x) / 2;
  const centerY = (canvas.vptCoords.bl.y + canvas.vptCoords.tl.y) / 2;

  if (chunk.x !== getLTC(centerX) + startPoint.x || chunk.y !== getLTC(centerY) + startPoint.y) {
    const nextChunk = {
      x: getLTC(centerX) + startPoint.x,
      y: getLTC(centerY) + startPoint.y,
    };
    leaveRoom(chunk.x, chunk.y);
    chunk.x = nextChunk.x * 1;
    chunk.y = nextChunk.y * 1;
    joinRoom(chunk.x, chunk.y);
    //onResize();
    // console.log('different place');
  }
}

canvas.on('mouse:up', (ew) => {
  if (ew.e instanceof MouseEvent) {
    userNavUp(ew.e);
  } else {
    userNavUp(ew.e.touches[0]);
  }
  canvas.renderAll();
});

function updateCanvasMove() {
  const vptc = canvas.vptCoords;
  const centerX = (vptc.tr.x + vptc.tl.x) / 2;
  const centerY = (vptc.bl.y + vptc.tl.y) / 2;
  if (chunk.x !== getLTC(centerX) + startPoint.x || chunk.y !== getLTC(centerY) + startPoint.y) {
    const nextChunk = {
      x: getLTC(centerX) + startPoint.x,
      y: getLTC(centerY) + startPoint.y,
    };
    leaveRoom(chunk.x, chunk.y);
    chunk.x = nextChunk.x * 1;
    chunk.y = nextChunk.y * 1;
    joinRoom(chunk.x, chunk.y);
    //onResize();
    // console.log('different place');
  }
  for (let i = getLTC(vptc.tl.x) + startPoint.x; i <= getLTC(vptc.br.x) + startPoint.x; i += CANVAS_SIZE) {
    for (let j = getLTC(vptc.tl.y) + startPoint.y; j <= getLTC(vptc.br.y) + startPoint.y; j += CANVAS_SIZE) {
      //console.log(`checking : ${i},${j}`);
      if (currentChunks[`${i},${j}`] !== true) {
        //console.log(`adding : ${i},${j}`);
        //if(canvas.getZoom() > 2) {
        //fetchPng(i, j);
        //} else {
        fetchMapPngs(i, j);
        fetchChunkFromOther(i, j);
        //}
        currentChunks[`${i},${j}`] = true;
      }
    }
  }
  const curCenterX = ((canvas.vptCoords.tr.x + canvas.vptCoords.tl.x) / 2) + startPoint.x;
  const curCenterY = ((canvas.vptCoords.bl.y + canvas.vptCoords.tl.y) / 2) + startPoint.y;
  moveMapPointer(curCenterX, curCenterY);
}

function zoomToCenter(isZoomIn) {
  if (isZoomIn) {
    if (canvas.getZoom() < 5) {
      canvas.zoomToPoint(new fabric.Point(canvas.width / 2, canvas.height / 2), canvas.getZoom() * 1.1);
    } else {
      // console.log('no zoom any more');
      canvas.setZoom(5);
      canvas.renderAll();
    }

  } else {
    if (canvas.getZoom() > 0.04) {
      if (canvas.getZoom() < DRAWABLE_ZOOM_LIMIT) {
        changeModeToNavigatingMode();
        changeInfoText("줌아웃을 많이 해서 내비게이션 모드로 전환합니다.", "shake", "alert-danger");
      }
      canvas.zoomToPoint(new fabric.Point(canvas.width / 2, canvas.height / 2), canvas.getZoom() * 0.9);
    } else {
      // console.log('no zoom any more');
      canvas.setZoom(0.04);
      canvas.renderAll();
    }
  }
  reflectZoomOnMap();
}

let canWheel = true;

function onWheel(e) {
  if (!canWheel) { return; }
  canWheel = false;
  if (e.deltaY > 0) {
    //console.log('wheel back');
    zoomToCenter(false);
    updateCanvasMove();
    //changeInfoText('줌 아웃', 'fadeIn', 'alert-primary');
  } else {
    //console.log('wheel foward');
    zoomToCenter(true);
    updateCanvasMove();
    //changeInfoText('줌 인', 'fadeIn', 'alert-primary');
  }
  canWheel = true;
}

canvas.on('mouse:wheel', (ew) => {
  onWheel(ew.e);
});

$('.zoomin-btn').click( () => {
  zoomToCenter(true);
  updateCanvasMove();
  changeInfoText('줌 인', 'fadeIn', 'alert-primary');
});

$('.zoomout-btn').click( () => {
  zoomToCenter(false);
  updateCanvasMove();
  changeInfoText('줌 아웃', 'fadeIn', 'alert-primary');
});

$.fn.extend({
  animateCss: function (animationName) {
    var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
    this.addClass('animated ' + animationName).one(animationEnd, function () {
      $(this).removeClass('animated ' + animationName);
    });
    return this;
  },
});

const mapToggle = document.getElementById('map-toggle');

mapToggle.onclick = () => {
  if ($("#map-container").is(":visible")) {
    $("#map-container").hide("slow");
  } else {
    $("#map-container").show("slow");
  }
};

window.addEventListener("resize", onResize);



function fillCanvasWithImage(x, y, pngData) {
  fabric.Image.fromURL(pngData, (oImg) => {
    canvas.add(oImg);
  });
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

function selectStartChunk() {
  chunk.x = getRandomIntInclusive(POPULAR_CHUNK_COORD_START, POPULAR_CHUNK_COORD_STOP) * CANVAS_SIZE;
  startPoint.x = chunk.x;
  chunk.y = getRandomIntInclusive(POPULAR_CHUNK_COORD_START , POPULAR_CHUNK_COORD_STOP) * CANVAS_SIZE;
  startPoint.y = chunk.y;
}

function init() {
  selectStartChunk();
  fetchChunk(chunk.x, chunk.y);
  // console.log(`startpoint : ${startPoint.x},${startPoint.y}`);
  joinRoom(chunk.x, chunk.y);
  onResize();
  $('#init-modal').modal({ backdrop: 'static', keyboard: false });
}

init();

////////////////////////////////////////////////////////////////////////////////////

//not used
function moveChunk(destX, destY) {
  // console.log(`destX,Y 1 : ${destX} , ${destY}`);
  // console.log(`chunkX,Y 1 : ${chunk.x} , ${chunk.y}`);
  leaveRoom(chunk.x, chunk.y);
  chunk.x = destX * 1;
  chunk.y = destY * 1;
  // console.log(`destX,Y 2 : ${destX} , ${destY}`);
  // console.log(`chunkX,Y 2 : ${chunk.x} , ${chunk.y}`);
  joinRoom(destX, destY);
  fetchChunk(destX, destY);
  startPoint.x = destX * 1;
  startPoint.y = destY * 1;
  // console.log(`destX,Y 3 : ${destX} , ${destY}`);
  // console.log(`chunkX,Y 3 : ${chunk.x} , ${chunk.y}`);
  currentChunks = {};
  //onResize();
}

// needs validation
// not used
function moveToCoord() {
  if (coordString == null) {
    // console.log('null coordString');
  } else {
    // console.log(coordString);
  }
  const inputArr = coordString.split(',');
  const inputX = parseInt(inputArr[0], 10);
  const inputY = parseInt(inputArr[0], 10);
  if (inputArr[0] != null) {
    moveChunk(inputArr[0] * CANVAS_SIZE, inputArr[1] * CANVAS_SIZE);
  }
}

// right click event
$(".canvas-container").bind("contextmenu", function(event) { 
  event.preventDefault();
  $(".custom-menu").css({top: event.pageY + "px", left: event.pageX + "px"});
  $(".custom-menu").toggle();
}).bind("click", function(event) {
  $(".custom-menu").hide();
});
$(".custom-menu").bind("contextmenu", function(event) { 
  event.preventDefault();
  $(".custom-menu").toggle();
});

$("#marker-add-btn").click( () => {
  if($("#marker-list").find("li").length > 4){
    alert("최대 5개까지 설정 가능합니다.")
    return;
  }
  var curWidth = canvas.freeDrawingBrush.width;
  var curColor = canvas.freeDrawingBrush.color;
  $("#marker-list").append(`<li><button class="btn-sm marker-btn" 
  style="background-color:${curColor}" 
  data-color=${curColor} 
  data-width=${curWidth}>
  ${curWidth}</button>
  <button class="btn-sm btn-dark" id="marker-remove-btn">
  <span class="fa fa-minus"></span></button></li>`);
});

$(document).on("click", ".marker-btn", function(e){
  var marker = $(e.target);
  hueb.setColor(marker.data("color"));
  lineWidthSlider.noUiSlider.set(marker.data("width"));
  canvas.freeDrawingBrush.width = marker.data("width");
  $(".custom-menu").hide();
});

$(document).on("click","#marker-remove-btn",function(e){
  $(e.target).parent().remove();
});

//not used
// function zoomByMouseCoords(e, isZoomIn) {
//   const pointer = canvas.getPointer(e);
//   if (isZoomIn) {
//     if (canvas.getZoom() < 5) {
//       canvas.absolutePan(new fabric.Point(canvas.getZoom() * pointer.x, canvas.getZoom() * pointer.y));
//       canvas.setZoom(canvas.getZoom() * 1.1);
//       canvas.relativePan(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2));
//     } else {
//       // console.log('no zoom any more');
//       canvas.setZoom(5);
//       canvas.renderAll();
//     }
//   } else {
//     if (canvas.getZoom() > 0.04) {
//       canvas.absolutePan(new fabric.Point(canvas.getZoom() * pointer.x, canvas.getZoom() * pointer.y));
//       canvas.setZoom(canvas.getZoom() * 0.9);
//       canvas.relativePan(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2));
//     } else {
//       // console.log('no zoom any more');
//       canvas.setZoom(0.04);
//     }
//     canvas.renderAll();
//   }
// }