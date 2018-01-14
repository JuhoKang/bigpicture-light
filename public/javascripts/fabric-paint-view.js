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
});
canvas.selection = false;
let chunk = {
  x: 4096 * 10,
  y: 4096 * 10,
};

let startPoint = {
  x: 4096 * 10,
  y: 4096 * 10,
};

cSize = {
  x: 1,
  y: 1,
};



// get Left Top Coordinate
function getLTC(num) {
  if (num >= 0) {
    return num - (num % 4096);
  } else {
    if (num % 4096 !== 0) {
      return num - (num % 4096) - 4096;
    } else {
      return num;
    }
  }
}

$('.spinner').hide();

const lineWidthSlider = document.getElementById('drawing-line-width');
//const lineWidthInput = document.getElementById('drawing-line-width-input');

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
    max: 150,
  },
});

lineWidthSlider.noUiSlider.on('change', (e) => {
  canvas.freeDrawingBrush.width = parseInt(e, 10) || 1;
});

lineWidthSlider.noUiSlider.on('slide', (e) => {
  //lineWidthInput.value = parseInt(e, 10) || 1;
});

//not changing uislider
/*lineWidthInput.addEventListener('change', () => {
  lineWidthSlider.noUiSlider.set(this.value);
});*/

fabric.Object.prototype.transparentCorners = false;

const drawingModeEl = document.getElementById('changeMode');
const drawingColorEl = document.getElementById('drawing-color');
const drawingShadowColorEl = document.getElementById('drawing-shadow-color');
const pencilButton = document.getElementById('pencilStyle');
const brushButton = document.getElementById('brushStyle');

const changeButton = document.getElementById('changeButton');

function changeModeToDrawingMode() {
  canvas.isDrawingMode = true;
  canvas.setCursor(canvas.freeDrawingCursor);
}

function changeModeToNavigatingMode() {
  console.log("clicked");
  canvas.isDrawingMode = false;
  canvas.defaultCursor = canvas.moveCursor;
}

// needs validation
$('#moveToCoord').click(() => {
  //const coordString = $('#moveToCoordInput').val();
  if (coordString == null) {
    console.log('null coordString');
  } else {
    
    console.log(coordString);
  }
  
  console.log(coordString);
  const inputArr = coordString.split(',');
  const inputX = parseInt(inputArr[0], 10);
  const inputY = parseInt(inputArr[0], 10);
  if (inputArr[0] != null) {
    moveChunk(inputArr[0] * 4096, inputArr[1] * 4096);
  }
  //updateCanvasMove();
});

var hueb = new Huebee('.color-input', {
  notation: 'hex',
  staticOpen: false,
});

hueb.on('change', function(color, hue, sat, lum) {
  canvas.freeDrawingBrush.color = color;
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

function rgb2hex(rgb) {
  rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  function hex(x) {
      return (`0${parseInt(x, 10).toString(16)}`).slice(-2);
  }
  return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
}

var drawCount = 0;

$(document).keyup(function(event){
  console.log(event);
	if(event.keyCode === 90 && event.ctrlKey) {
    console.log('ctrl z');
    unDo();
	}
});

function unDo() {
  var objects = canvas.getObjects();
  console.log(objects);
  if(drawCount > 0) {
    for(var i = objects.length - 1; i > -1; i--) {
      if(objects[i].owner === guid) {
        console.log('remove');
        console.log(objects[i]);
        removeFromRemote(objects[i]);
        canvas.remove(objects[i]);
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
  console.log(aCoords);
  if (aCoords.tl.x + startPoint.x >= chunk.x + 4096) {
    return true;
  } else if (aCoords.tl.y + startPoint.y >= chunk.y + 4096) {
    return true;
  } else if (aCoords.br.x + startPoint.x < chunk.x) {
    return true;
  } else if (aCoords.br.y + startPoint.y < chunk.y) {
    return true;
  }
  return false;
}

const guid = uuidv4();

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const onObjectAdded = (e) => {
  if (!e.target.isNotMine) {
    drawCount += 1;
    e.target.selectable = false;
    e.target.owner = guid;

    console.log('object added');
    console.log(e.target);

    const clonedObj = fabric.util.object.clone(e.target);

    console.log(`clonedObj.left : ${clonedObj.left} , top : ${clonedObj.top}`);
    clonedObj.owner = guid;

    console.log(`envelope x : ${getLTC(startPoint.x + e.target.aCoords.tl.x)} , y : ${getLTC(startPoint.y + e.target.aCoords.tl.y)}`);

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
    console.log('object added from other');
  }
};

canvas.on('object:added', onObjectAdded);

function fetchChunk(x, y) {
  canvas.off('object:added');
  //change svg to json
  $.get(`/api/paintchunk/json/coord/${x}/${y}`).then((json) => {
    canvas.clear();
    canvas.absolutePan(new fabric.Point(0, 0));
    canvas.loadFromJSON(json);
    canvas.forEachObject((o) => {
      o.selectable = false;
    });
    canvas.on('object:added', onObjectAdded);
  });
  currentChunks[`${x},${y}`] = true;
}

function fetchChunkSocket(x, y) {
  socket.emit('getChunkData', { x, y, isMain: true });
}

socket.on('mainChunkSend', (data) => {
  console.log('mainChunkSend');
  console.log(data);
  canvas.off('object:added');
  canvas.clear();
  canvas.absolutePan(new fabric.Point(0, 0));
  canvas.loadFromJSON(data.json);
  canvas.forEachObject((o) => {
    o.selectable = false;
  });
  currentChunks[`${data.x},${data.y}`] = true;
  canvas.on('object:added', onObjectAdded);
});

function fetchOtherChunkSocket(x, y) {
  socket.emit('getChunkData', { x, y, isMain: false });
}

socket.on('otherChunkSend', (data) => {
  const fc = document.createElement('canvas');
  console.log('otherChunkSend');
  console.log(data);
  const fetchCanvas = new fabric.Canvas(fc, { renderOnAddRemove: false });
  //change svg to json
  console.log(`fetch from ${data.x},${data.y}`);
  
  $('.spinner').css('margin-left', (canvas.width / 2) - 20);
  $('.spinner').css('margin-top', (canvas.height / 2) - 20);
  canvas.off('object:added');
  if (data.json == null) {
    canvas.on('object:added', onObjectAdded);
    $('#infotext').text('로딩 완료');
    $('#infotext').attr('class', 'col-lg-3 col-md-12 col-sm-12 alert alert-success btn-block');
    $('#infotext').animateCss('flash');
  } else {
    fetchCanvas.loadFromJSON(data.json, () => {
      canvas.on('object:added', onObjectAdded);
      console.log(`fetch done : ${data.x},${data.y}`);
      $('#infotext').text('로딩 완료');
      $('#infotext').attr('class', 'col-lg-3 col-md-12 col-sm-12 alert alert-success btn-block');
      $('#infotext').animateCss('flash');
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

function fetchChunkFromOther(x, y) {
  const fc = document.createElement('canvas');
  // 131072 = 4096 * 32
  if (x < 0 || y < 0 || x > 131072 || y > 131072) {
    console.log('here');
    const patternSourceCanvas = new fabric.StaticCanvas();
    const darkRect = new fabric.Rect({
      width: 32,
      height: 32,
      fill: '#000',
    });
    patternSourceCanvas.add(darkRect);
    patternSourceCanvas.renderAll();
    const pattern = new fabric.Pattern({
      source: function () {
        patternSourceCanvas.setDimensions({
          width: 64,
          height: 64,
        });
        patternSourceCanvas.renderAll();
        return patternSourceCanvas.getElement();
      },
      repeat: 'repeat',
    });

    const rect = new fabric.Rect({
      width: 4096,
      height: 4096,
      left: x - startPoint.x,
      top: y - startPoint.y,
      fill: pattern,
    });
    rect.selectable = false;
    rect.isNotMine = true;
    canvas.add(rect);
  } else {
    const fetchCanvas = new fabric.Canvas(fc, { renderOnAddRemove: false });
    //change svg to json
    console.log(`fetch from ${x},${y}`);
    
    $('.spinner').css('margin-left', (canvas.width / 2) - 20);
    $('.spinner').css('margin-top', (canvas.height / 2) - 20);
    $.get(`/api/paintchunk/json/coord/${x}/${y}`, function() {
      $('#infotext').text('로딩중');
      $('#infotext').attr('class', 'col-lg-3 col-md-12 col-sm-12 alert alert-danger btn-block');
      $('#infotext').animateCss('flash');
      console.log(`fetching from other : ${x},${y}`);
    }).then((json) => {
      canvas.off('object:added');
      if(json == null) {
        canvas.on('object:added', onObjectAdded);
        $('#infotext').text('로딩 완료');
        $('#infotext').attr('class', 'col-lg-3 col-md-12 col-sm-12 alert alert-success btn-block');
        $('#infotext').animateCss('flash');
      } else {
        fetchCanvas.loadFromJSON(json, () => {
          canvas.on('object:added', onObjectAdded);
          console.log(`fetch done : ${x},${y}`);
          $('#infotext').text('로딩 완료');
          $('#infotext').attr('class', 'col-lg-3 col-md-12 col-sm-12 alert alert-success btn-block');
          $('#infotext').animateCss('flash');
        }, (o, object) => {
          object.left += x - startPoint.x;
          object.top += y - startPoint.y;
          object.isNotMine = true;
          canvas.add(object);
        });
          
        fetchCanvas.forEachObject((o) => {
          o.isNotMine = true;
          o.selectable = false;
        });
      }
      
    });
  }
}

function fetchChunkFromOtherSocket(x, y) {
  const fc = document.createElement('canvas');
  // 131072 = 4096 * 32
  if (x < 0 || y < 0 || x > 131072 || y > 131072) {
    console.log('here');
    const patternSourceCanvas = new fabric.StaticCanvas();
    const darkRect = new fabric.Rect({
      width: 32,
      height: 32,
      fill: '#000',
    });
    patternSourceCanvas.add(darkRect);
    patternSourceCanvas.renderAll();
    const pattern = new fabric.Pattern({
      source: function () {
        patternSourceCanvas.setDimensions({
          width: 64,
          height: 64,
        });
        patternSourceCanvas.renderAll();
        return patternSourceCanvas.getElement();
      },
      repeat: 'repeat',
    });

    const rect = new fabric.Rect({
      width: 4096,
      height: 4096,
      left: x - startPoint.x,
      top: y - startPoint.y,
      fill: pattern,
    });
    rect.selectable = false;
    rect.isNotMine = true;
    canvas.add(rect);
  } else {
    fetchOtherChunkSocket(x, y);
  }
}

function onResize() {
  cSize.x = $('#c').parent().parent().width();
  cSize.y = window.innerHeight - $('#c').offset().top;
  canvas.setWidth(cSize.x);
  canvas.setHeight(cSize.y);
}

function joinRoom(x, y) {
  console.log(x);
  console.log(y);
  console.log(`joinRoom : ${x},${y}`);
  socket.emit('joinRoom', { x, y });
}

function leaveRoom(x, y) {
  console.log(`leaveRoom : ${x},${y}`);
  socket.emit('leaveRoom', { x, y });
}

function init() {
  fetchChunkSocket(chunk.x, chunk.y);
  console.log(`startpoint : ${startPoint.x},${startPoint.y}`);
  joinRoom(chunk.x, chunk.y);
  onResize();
  $('#init-modal').modal({backdrop: 'static', keyboard: false});
}

function moveChunk(destX, destY) {
  console.log(`destX,Y 1 : ${destX} , ${destY}`);
  console.log(`chunkX,Y 1 : ${chunk.x} , ${chunk.y}`);
  leaveRoom(chunk.x, chunk.y);
  chunk.x = destX * 1;
  chunk.y = destY * 1;
  console.log(`destX,Y 2 : ${destX} , ${destY}`);
  console.log(`chunkX,Y 2 : ${chunk.x} , ${chunk.y}`);
  joinRoom(destX, destY);
  fetchChunk(destX, destY);
  startPoint.x = destX * 1;
  startPoint.y = destY * 1;
  console.log(`destX,Y 3 : ${destX} , ${destY}`);
  console.log(`chunkX,Y 3 : ${chunk.x} , ${chunk.y}`);
  currentChunks = {};
  onResize();
}

let starttime;

const onObjectFromOther = (data) => {
  console.log('hello');
  console.log(data);
  $('#infotext').text('누군가 그리고있어요!');
  $('#infotext').attr('class', 'col-lg-3 col-md-12 col-sm-12 alert alert-success btn-block');
  $('#infotext').animateCss('jello');
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
  console.log(uid);
  $('#infotext').text('누군가 그리고있어요!');
  $('#infotext').attr('class', 'col-lg-4 col-md-12 col-sm-12 alert alert-success btn-block');
  $('#infotext').animateCss('jello');
  let objects = canvas.getObjects();
  for(var i = objects.length - 1; i > -1; i--) {
    if(objects[i].owner === uid) {
      console.log('remove');
      canvas.remove(objects[i]);
      break;
    }
  }
}

socket.on('undoFromOther', onUndoFromOther);

let isPanning = false;
let beforePoint;
// ew is eventWrapper. ew.e is mouseevent

// need smooth moving like degak (go left up if left full go up)

const touchStart = Rx.Observable.fromEvent(canvas, 'touchstart');
const touchMove = Rx.Observable.fromEvent(canvas, 'touchmove');
const touchEnd = Rx.Observable.fromEvent(canvas, 'touchend');
const touchLeave = Rx.Observable.fromEvent(canvas, 'touchleave');

const subscribeTouchStart = touchStart.subscribe((e) => {
  e.preventDefault();
  console.log(e);
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

let storeX = 0;
let storeY = 0;

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
    console.log(`x: ${clickPoint.x + startPoint.x} , y: ${clickPoint.y + startPoint.y}`);
    userNavDown(ew.e);
  } else {
    const clickPoint = canvas.getPointer(ew.e.touches[0]);
    console.log(`x: ${clickPoint.x + startPoint.x} , y: ${clickPoint.y + startPoint.y}`);
    userNavDown(ew.e.touches[0]);
  }
});

function userNavMove(e) {
  if (!canvas.isDrawingMode) {
    if (isPanning === true) {
      const x = e.screenX;
      const y = e.screenY;
      canvas.relativePan(new fabric.Point(x - beforePoint.x, y - beforePoint.y));
      updateCanvasMove();
      beforePoint.x = x;
      beforePoint.y = y;
    }
  }
}

//do something with storeXY
canvas.on('mouse:move', (ew) => {
  //console.log(canvas.getPointer(ew.e));
  if (ew.e instanceof MouseEvent) {
    userNavMove(ew.e);
  } else {
    userNavMove(ew.e.touches[0]);
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
    onResize();
    console.log('different place');
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

let canWheel = true;
canvas.on('mouse:wheel', (ew) => {
  onWheel(ew.e);
});

function zoomByMouseCoords(e, isZoomIn) {
  const pointer = canvas.getPointer(e);
  if (isZoomIn) {
    if (canvas.getZoom() < 5) {
      canvas.absolutePan(new fabric.Point(canvas.getZoom() * pointer.x, canvas.getZoom() * pointer.y));
      canvas.setZoom(canvas.getZoom() * 1.1);
      canvas.relativePan(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2));
    } else {
      console.log('no zoom any more');
      canvas.setZoom(5);
      canvas.renderAll();
    }

  } else {
    if (canvas.getZoom() > 0.04) {
      canvas.absolutePan(new fabric.Point(canvas.getZoom() * pointer.x, canvas.getZoom() * pointer.y));
      canvas.setZoom(canvas.getZoom() * 0.9);
      canvas.relativePan(new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2));
    } else {
      console.log('no zoom any more');
      canvas.setZoom(0.04);
    }
    canvas.renderAll();
  }
}

let currentChunks = {};
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
    onResize();
    console.log('different place');
  }
  for (let i = getLTC(vptc.tl.x) + startPoint.x; i <= getLTC(vptc.br.x) + startPoint.x; i += 4096) {
    for (let j = getLTC(vptc.tl.y) + startPoint.y; j <= getLTC(vptc.br.y) + startPoint.y; j += 4096) {
      //console.log(`checking : ${i},${j}`);
      if (currentChunks[`${i},${j}`] !== true) {
        console.log(`adding : ${i},${j}`);
        //fetchChunkFromOther(i, j);
        fetchChunkFromOtherSocket(i, j);
        currentChunks[`${i},${j}`] = true;
      }
    }
  }
  const curCenterX = ((canvas.vptCoords.tr.x + canvas.vptCoords.tl.x) / 2) + startPoint.x;
  const curCenterY = ((canvas.vptCoords.bl.y + canvas.vptCoords.tl.y) / 2) + startPoint.y;
  moveMapPointer(curCenterX, curCenterY);
}

$.fn.extend({
  animateCss: function (animationName) {
      var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
      this.addClass('animated ' + animationName).one(animationEnd, function() {
          $(this).removeClass('animated ' + animationName);
      });
      return this;
  },
});

function onWheel(e) {
  if (!canWheel) { return; }
  canWheel = false;
  if (e.deltaY > 0) {
    //console.log('wheel back');
    zoomByMouseCoords(e, false);
    updateCanvasMove();
    $('#infotext').text('줌 아웃');
    $('#infotext').attr('class', 'col-lg-3 col-md-12 col-sm-12 alert alert-primary btn-block');
    $('#infotext').animateCss('fadeIn');
    //canvas.setZoom(canvas.getZoom() * 0.9);
  } else {
    //zoomByMouseCoords(e, false);
    //console.log('wheel foward');
    updateCanvasMove();
    $('#infotext').text('줌 인');
    $('#infotext').attr('class', 'col-lg-3 col-md-12 col-sm-12 alert alert-primary btn-block');
    $('#infotext').animateCss('fadeIn');
    zoomByMouseCoords(e, true);
    //canvas.setZoom(canvas.getZoom() * 1.1);
  }
  canWheel = true;
}

const mapToggle = document.getElementById('map-toggle');

mapToggle.onclick = () => {
  if ($('#map-container').is(':visible')) {
    $('#map-container').hide('slow');
  } else {
    $('#map-container').show('slow');
  }
};

window.addEventListener('resize', onResize);
init();
