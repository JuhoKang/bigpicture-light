/* global io:true
  document:true
  $:true
  window:true
  Rx:true
  ImageData:true*/
/* eslint no-undef: "error"*/
//not used. bitmap version code here

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const scaleSlider = document.getElementById('canvasScale');

noUiSlider.create(scaleSlider, {
	start: [1],
	step: 1,
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
    min: 1,
    max: 3,
  },
});

let brushStyle = {};

const socket = io();

function isZoomMode() {
  if (scaleSlider.noUiSlider.get() > 1) {
    return true;
  }
  return false;
}

const startPoint = {
  x: 0,
  y: 0,
};

const middlePoint = {
  x: 0,
  y: 0,
};

let cellArray = {};
let cellSwitchArray = {};

// canvas size integers should be changed
const cSize = {
  x: 4,
  y: 4,
};

let currentStyleChange = {};


let canMove = true;

//canMove set
function setCanMove(bool) {
  canMove = bool;
  if (canMove) {
    scaleSlider.removeAttribute('disabled');
  } else {
    scaleSlider.setAttribute('disabled', true);
  }
}

// get Letf Top Coordinate
function getLTC(num) {
  return num - (num % 100);
}

function getLTC2(num, num2) {
  return num - (num % num2);
}


function randomHundred() {
  return Math.floor((Math.random() * 10) + 1) * 100; // 0 ~ 9 * 100
}

function isHundreds(n) {
  return n % 100 === 0;
}

function updateStartPointText() {
  $('#showCurrentCoord').text(`you are at ${startPoint.x},${startPoint.y}`);
}

function joinRooms(roomlist) {
  if (roomlist == null) {
    const allRoomlist = [];
    for (let i = 0; i < cSize.x; i += 1) {
      for (let j = 0; j < cSize.y; j += 1) {
        allRoomlist.push(`${toServerX(i * 100)},${toServerY(j * 100)}`);
        console.log(`joining : ${toServerX(i * 100)},${toServerY(j * 100)}`);
      }
    }
    socket.emit('joinRoom', allRoomlist);
  } else {
    for (let i = 0; i < roomlist.length; i += 1) {
      console.log(`joining : ${roomlist[i]}`);
    }
    socket.emit('joinRoom', roomlist);
  }
}

function leaveRooms(roomlist) {
  if (roomlist == null) {
    const allRoomlist = [];
    for (let i = 0; i < cSize.x; i += 1) {
      for (let j = 0; j < cSize.y; j += 1) {
        allRoomlist.push(`${toServerX(i * 100)},${toServerY(j * 100)}`);
        console.log(`leaving : ${toServerX(i * 100)},${toServerY(j * 100)}`);
      }
    }
    socket.emit('leaveRoom', allRoomlist);
  } else {
    for (let i = 0; i < roomlist.length; i += 1) {
      console.log(`leaving : ${roomlist[i]}`);
    }
    socket.emit('leaveRoom', roomlist);
  }
}

function onResize() {
  if (isZoomMode()) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    leaveRooms();
    joinRooms();
    getAllAndDraw();
  } else {
    console.log('not zoomMode');
    cSize.x = getLTC($('#c').parent().width()) / 100;
    cSize.y = getLTC(window.innerHeight - $('#c').offset().top) / 100;
    $('#showCurrentCoord').text(`you are at ${startPoint.x},${startPoint.y}`);
    // cSize.x = randomHundred() / 100;
    canvas.width = cSize.x * 100;
    // cSize.y = randomHundred() / 100;
    canvas.height = cSize.y * 100;
    leaveRooms();
    joinRooms();  
    getAllAndDraw();

    console.log('JOIN ROOM LIST', socket.adapter.rooms);
  }
}

function clearStyles(ctx) {
  ctx.shadowBlur = 0;
  ctx.lineJoin = '';
  ctx.lineCap = '';
}

window.addEventListener('resize', onResize);

function toServerX(x) {
  return parseInt(x, 10) + startPoint.x;
}

function toServerY(y) {
  return parseInt(y, 10) + startPoint.y;
}

function fromServerX(x) {
  return parseInt(x, 10) - startPoint.x;
}

function fromServerY(y) {
  return parseInt(y, 10) - startPoint.y;
}
function correctX(x) {
  return x - canvas.getBoundingClientRect().left;
}
function correctY(y) {
  return y - canvas.getBoundingClientRect().top;
}

function drawLine(x0, y0, x1, y1, color, ctxChange, emit, style) {
  console.log('draw');
  context.beginPath();
  context.moveTo(x0, y0);
  context.lineWidth = 2;

  if (ctxChange != null) {
    // if (ctxChange.lineWidth != null) {
    //  context.lineWidth = ctxChange.lineWidth;
    // }
    if (ctxChange.shadowBlur != null) {
      context.shadowBlur = ctxChange.shadowBlur;
    }
    if (ctxChange.shadowColor != null) {
      context.shadowColor = ctxChange.shadowColor;
    }
    if (ctxChange.lineJoin != null) {
      context.lineJoin = ctxChange.lineJoin;
    }
    if (ctxChange.lineCap != null) {
      context.lineCap = ctxChange.lineCap;
    }
  }

  if (style == null) {
    context.lineWidth = 3;
  } else if (style.name === 'brush') {
    for (let i = 0; i < style.width / 2; i += 1) {
      drawLine(x0 + i, y0 + i, x1 + i, y1 + i, color, ctxChange, emit);
      drawLine(x0 - i, y0 - i, x1 - i, y1 - i, color, ctxChange, emit);
    }
  } else if (style.name === 'pencil') {
    context.lineWidth = style.width;
  }
  context.lineTo(x1, y1);
  context.strokeStyle = color;
  context.stroke();
  context.closePath();

  if (!emit) { return; }
  socket.emit('drawToRoom', {
    coord: `${getLTC(toServerX(x1))},${getLTC(toServerY(y1))}`,
    drawData: {
      x0: toServerX(x0),
      y0: toServerY(y0),
      x1: toServerX(x1),
      y1: toServerY(y1),
      color,
      ctxChange,
      style,
    },
  });
}

function onDrawingEvent(data) {
  drawLine(fromServerX(data.x0), fromServerY(data.y0),
    fromServerX(data.x1), fromServerY(data.y1), data.color, data.ctxChange, false, data.style);
}

function sendToServerCoord(coordString) {
  const arr = coordString.split(',');
  $.post('/api/imagedatacell/create', {
    x_axis: arr[0],
    y_axis: arr[1],
    data: JSON.stringify(Array.from(
      context.getImageData(fromServerX(arr[0]), fromServerY(arr[1]), 100, 100).data)),
  }).done((msg) => {
    console.log('done post');
    // console.log(msg);
  });
}

function updateModifiedCells() {
  for (const key in cellSwitchArray) {
    sendToServerCoord(key);
    console.log('save : ' + key);
  }
  cellSwitchArray = {};
}

socket.on('drawing', onDrawingEvent);
// socket.on('checkUpdate', onCheckUpdateEvent);

const mouseMove = Rx.Observable.fromEvent(canvas, 'mousemove');
const mouseDown = Rx.Observable.fromEvent(canvas, 'mousedown');
const mouseUp = Rx.Observable.fromEvent(canvas, 'mouseup');
const mouseOut = Rx.Observable.fromEvent(canvas, 'mouseout');

const current = { color: 'black' };

let drawFlag = false;
let grabFlag = false;

canvas.style.cursor = 'pointer'; // optional crosshair

function setCellSwitchOn(x, y) {
  if (x < getLTC(startPoint.x + ((cSize.x) * 100)) &&
    x >= getLTC(startPoint.x) &&
    y < getLTC(startPoint.y + ((cSize.y) * 100)) &&
    y >= getLTC(startPoint.y)) {
    if (cellSwitchArray[`${getLTC(x)},${getLTC(y)}`] !== true) {
      cellSwitchArray[`${getLTC(x)},${getLTC(y)}`] = true;
    }
  } else {
    // console.log(`outside : ${x},${y}`);
  }
  const revLX = getLTC(x - (context.shadowBlur / 2 + context.lineWidth / 2 + 1));
  const revRX = getLTC(x + (context.shadowBlur / 2 + context.lineWidth / 2 + 1));
  const revUY = getLTC(y - (context.shadowBlur / 2 + context.lineWidth / 2 + 1));
  const revDY = getLTC(y + (context.shadowBlur / 2 + context.lineWidth / 2 + 1));
  // console.log(`lrud : ${revLX},${revRX},${revUY},${revDY}`);
  if (revLX >= startPoint.x && revRX < startPoint.x + (cSize.x * 100) && revUY >= startPoint.y && revDY < startPoint.y + (cSize.y * 100)) {
    //. console.log('here1');
    if (cellSwitchArray[`${revLX},${revUY}`] !== true) {
      // console.log(`ltc>sp.x : rLX,rUY : ${revLX},${revUY}`);
      cellSwitchArray[`${revLX},${revUY}`] = true;
    }
    if (cellSwitchArray[`${revLX},${revDY}`] !== true) {
      // console.log(`ltc>sp.x : rLX,rDY : ${revLX},${revDY}`);
      cellSwitchArray[`${revLX},${revDY}`] = true;
    }
    if (cellSwitchArray[`${revRX},${revUY}`] !== true) {
      // console.log(`ltc<sp.x +c.x : rRX,rUY : ${revRX},${revUY}`);
      cellSwitchArray[`${revRX},${revUY}`] = true;
    }
    if (cellSwitchArray[`${revRX},${revDY}`] !== true) {
      // console.log(`ltc<sp.x +c.x : rRX,rDY : ${revRX},${revDY}`);
      cellSwitchArray[`${revRX},${revDY}`] = true;
    }
  }
  if (revLX >= startPoint.x && revRX < startPoint.x + (cSize.x * 100) && revUY >= startPoint.y && revDY < startPoint.y + (cSize.y * 100)) {
    // console.log('here2');
    if (cellSwitchArray[`${revLX},${revUY}`] !== true) {
      // console.log(`ltc>sp.y  : rLX,rUY : ${revLX},${revUY}`);
      cellSwitchArray[`${revLX},${revUY}`] = true;
    }
    if (cellSwitchArray[`${revRX},${revUY}`] !== true) {
      // console.log(`ltc>sp.y  : rRX,rUY : ${revRX},${revUY}`);
      cellSwitchArray[`${revRX},${revUY}`] = true;
    }
    if (cellSwitchArray[`${revLX},${revDY}`] !== true) {
      // console.log(`ltc<sp.y + c.y : rLX,rDY : ${revLX},${revDY}`);
      cellSwitchArray[`${revLX},${revDY}`] = true;
    }
    if (cellSwitchArray[`${revRX},${revDY}`] !== true) {
      // console.log(`ltc<sp.y + c.y : rRX,rDY : ${revRX},${revDY}`);
      cellSwitchArray[`${revRX},${revDY}`] = true;
    }
  }
}

let mouseDownPoint = {};

const subscribeMouseDown = mouseDown.subscribe((e) => {
  if (grabFlag === true) {
    mouseDownPoint.x = correctX(e.clientX);
    mouseDownPoint.y = correctY(e.clientY);
  } else {
    drawFlag = true;
    current.x = correctX(e.clientX);
    current.y = correctY(e.clientY);
    // console.log(`here is : ${toServerX(current.x)},${toServerY(current.y)}`);
    drawLine(current.x, current.y, correctX(e.clientX), correctY(e.clientY), current.color, currentStyleChange, true, brushStyle);
    setCellSwitchOn(toServerX(current.x), toServerY(current.y));
  }
});

const subscribeMouseUp = mouseUp.subscribe((e) => {
  if (!drawFlag) { return; }
  drawFlag = false;
  drawLine(current.x, current.y, current.x + 1, current.y + 1, current.color, currentStyleChange, true, brushStyle);
  updateModifiedCells();
});

const subscribeMouseMove = mouseMove.subscribe((e) => {
  if (grabFlag === true) {
    if (correctX(e.clientX) - 100 > mouseDownPoint.x) {
      canvasMoveLeft();
      mouseDownPoint = {};
    } else if (correctX(e.clientX) + 100 < mouseDownPoint.x) {
      canvasMoveRight();
      mouseDownPoint = {};
    } else if (correctY(e.clientY) - 100 > mouseDownPoint.y) {
      canvasMoveUp();
      mouseDownPoint = {};
    } else if (correctY(e.clientY) + 100 < mouseDownPoint.y) {
      canvasMoveDown();
      mouseDownPoint = {};
    }
  }

  if (!drawFlag) { return; }
  // console.log(correctX(e.clientX) + ',' + correctY(e.clientY));
  drawLine(current.x, current.y, correctX(e.clientX), correctY(e.clientY), current.color, currentStyleChange, true, brushStyle);
  current.x = correctX(e.clientX);
  current.y = correctY(e.clientY);
  setCellSwitchOn(toServerX(current.x), toServerY(current.y));
});

const subscribeMouseOut = mouseOut.subscribe((e) => {
  if (!drawFlag) { return; }
  drawFlag = false;
  drawLine(current.x, current.y, correctX(e.clientX), correctY(e.clientY), current.color, currentStyleChange, true, brushStyle);
  updateModifiedCells();
});

function clearCanvas(ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  clearStyles(ctx);
}

// const buttonClear = document.getElementById('clear');
// const buttonGetFromServer = document.getElementById('getFromServer');
// const buttonSendToServerCoord = document.getElementById('sendToServerCoord');
// const buttonGetFromServerCoord = document.getElementById('getFromServerCoord');
const buttonMoveToCoord = document.getElementById('moveToCoord');

// const buttonMoveLeft = document.getElementById('moveLeft');
// const buttonMoveRight = document.getElementById('moveRight');
// const buttonMoveDown = document.getElementById('moveDown');
// const buttonMoveUp = document.getElementById('moveUp');
// buttonMoveLeft.onclick = canvasMoveLeft();
// buttonMoveRight.onclick = canvasMoveRight();
// buttonMoveUp.onclick = canvasMoveUp();
// buttonMoveDown.onclick = canvasMoveDown();

const buttonChangeMode = document.getElementById('changeMode');

buttonChangeMode.onclick = function() {
  if (grabFlag === false) {
    console.log('changeMode to grab');
    grabFlag = true;
    canvas.style.cursor = 'move';
  } else {
    console.log('changeMode to non-grab');
    grabFlag = false;
    canvas.style.cursor = 'pointer';
  }
};

function loadImage_Promise(src, x, y) {
  return new Promise((resolve, reject) => {
    const img = new Image(100, 100);
    let data = { data: null, dX: x, dY: y };
    img.src = src;
    img.onload = () => {
      console.log("load image: " + src);
      data.data = img;
      resolve(data);
    };
    img.onerror = () => {
      console.log("load image: error" + src);
      resolve(data);
    };
  });
}
/*
const buttonSendToServer = document.getElementById('sendToServer');
buttonSendToServer.onclick = () => {
  for (let i = 0; i < cSize.x; i++) {
    for (let j = 0; j < cSize.y; j++) {
      $.post('/api/imagedatacell/create', {
        x_axis: toServerX(i * 100),
        y_axis: toServerY(j * 100),
        data: JSON.stringify(Array.from(context.getImageData(i * 100, j * 100, 100, 100).data)),
        syncNum: 10,
      }).done((msg) => {
        console.log('done post');
        console.log(msg);
      });
    }
  }
};*/
// only get data
function getAllDataFromServer() {
  setCanMove(false);
  return new Promise((resolve, reject) => {
    const promises = [];
    cellArray = {};
    for (let i = 0; i < cSize.x; i += 1) {
      for (let j = 0; j < cSize.y; j += 1) {
        console.log(`get call : api/imagedatacell/coord/${toServerX(i * 100)}/${toServerY(j * 100)}`);
        promises.push($.get(`/api/imagedatacell/coord/${toServerX(i * 100)}/${toServerY(j * 100)}`).then((obj) => {
          // console.log(obj);
          if (obj.data == null) {
            // context.clearRect(obj.x_axis, obj.y_axis, 100, 100);
            console.log(`no data for ${obj.x_axis}, ${obj.y_axis}`);
            cellArray[`${obj.x_axis},${obj.y_axis}`] = {
              syncNum: 0,
              imgData: null,
            };
          } else {
            // console.log('got data for '+ i * 100 + ',' + j * 100);
            // console.log('x_axis : '+obj.x_axis+'  y_axis : '+obj.y_axis);getAllDataFromServer2
            // console.log(obj);
            // console.log(Uint8ClampedArray.from(JSON.parse(obj.data)));
            const imgData = new ImageData(Uint8ClampedArray.from(JSON.parse(obj.data)), 100, 100);
            // console.log(imgData);
            // console.log(new ImageData(JSON.parse(obj.data).data));
            // context.putImageData(imgData, i* 100, j * 100);
            // console.log('syncNum : '+obj.syncNum);
            if (obj.syncNum == null) {
              cellArray[`${obj.x_axis},${obj.y_axis}`] = {
                syncNum: 0,
                imgData,
              };
            } else {
              cellArray[`${obj.x_axis},${obj.y_axis}`] = {
                syncNum: obj.syncNum,
                imgData,
              };
            }
            // console.log(obj);
            // console.log(`put : ${obj.x_axis},${obj.y_axis}`);
            // context.putImageData(imgData, fromServerX(obj.x_axis), fromServerY(obj.y_axis));
          }
        }));
      }
    }
    Promise.all(promises).then(() => {
      console.log('done');
      resolve();
    });
  });
}

function drawAllCanvas() {
  console.log('drawAllCanvas');
  const keys = Object.keys(cellArray);
  for (let i = 0; i < keys.length; i += 1) {
    const cell = cellArray[keys[i]];
    const coord = keys[i].split(',');

    const x = coord[0];
    const y = coord[1];

    if (cell.imgData == null) {
      context.clearRect(cell.x_axis, cell.y_axis, 100, 100);
    } else {
      context.putImageData(cell.imgData, fromServerX(x), fromServerY(y));
    }
  }
}
function drawImageAllCanvas() {
  let imageArray = [];
  let count = 0;
  let promises = [];
  setCanMove(false);
  console.log('this draw Image' + startPoint.x + startPoint.y);
  for (let i = startPoint.x; i < startPoint.x + (cSize.x*100); i += (100)) {
    for (let j = startPoint.y; j < startPoint.y + (cSize.y*100); j += (100)) {
      let img = new Image(100, 100);
      let src;
      let scaleX = (i - startPoint.x) * (Math.pow(2, scaleSlider.noUiSlider.get() - 1));
      let scaleY = (j - startPoint.y) * (Math.pow(2, scaleSlider.noUiSlider.get() - 1));
      let startPointaddX = startPoint.x % ((Math.pow(2, scaleSlider.noUiSlider.get() - 1)) * 100);
      let startPointaddY = startPoint.y % ((Math.pow(2, scaleSlider.noUiSlider.get() - 1)) * 100);
      console.log("point" + startPointaddX + startPointaddY);
      if (startPointaddX !== 0 || startPointaddY !== 0) {
        scaleX = ((i - startPoint.x) * (Math.pow(2, scaleSlider.noUiSlider.get() - 1))) - startPointaddX;
        scaleY = ((j - startPoint.y) * (Math.pow(2, scaleSlider.noUiSlider.get() - 1))) - startPointaddY;
        src = '/' + (scaleSlider.noUiSlider.get()) + 'sc1f' + (startPoint.x + scaleX) + 'c' + (startPoint.y + scaleY);
        
        promises.push(loadImage_Promise(src, fromServerX(i) - startPointaddX, fromServerY(j) - startPointaddY));
        
        // $(img).load(function(){
        //   console.log("drawImage" + (fromServerX(i) - startPointaddX));
        //   context.drawImage(img, fromServerX(i) - startPointaddX, fromServerY(j) - startPointaddY);
        // }).error(function(){
        // });
      } else {
        console.log("1");
        src = '/' + (scaleSlider.noUiSlider.get()) + 'sc1f' + (startPoint.x + scaleX) + 'c' + (startPoint.y + scaleY);
        
        promises.push(loadImage_Promise(src, fromServerX(i), fromServerY(j)));
        // $(img).on('load', function() {
        //   context.drawImage(img, fromServerX(i), fromServerY(j));

        // });
      }
    }
  }
  return Promise.all(promises).then((results) => {
    results.forEach((e) => {
      if (e.data != null) {
        context.drawImage(e.data, e.dX, e.dY);
      }
    });
    setCanMove(true);
  });
}

function getAllAndDraw() {
  if (isZoomMode()) {
    drawImageAllCanvas();
  } else {
    getAllDataFromServer().then(() => {
      drawAllCanvas();
      setCanMove(true);
    });
  }
}

// buttonGetFromServer.onclick = () => getAllAndDraw();

/* buttonSendToServerCoord.onclick = () => {
  const coordString = $('#sendToServerCoordInput').val();
  const arr = coordString.split(',');
  $.post('/api/imagedatacell/create', {
    x_axis: toServerX(arr[0]),
    y_axis: toServerY(arr[1]),
    data: JSON.stringify(Array.from(context.getImageData(arr[0], arr[1], 100, 100).data)),
  }).done((msg) => {
    console.log('done post');
    console.log(msg);
  });
};*/

/* buttonGetFromServerCoord.onclick = () => {
  const coordString = $('#getFromServerCoordInput').val();
  const arr = coordString.split(',');
  console.log('get : ' + '/api/imagedatacell/coord/' + arr[0] + '/' + arr[1]);
  $.get('/api/imagedatacell/coord/' + arr[0] + '/' + arr[1]).done((obj) => {
    console.log('get : ' + '/api/imagedatacell/coord/' + arr[0] + '/' + arr[1]);
    const imgData = new ImageData(Uint8ClampedArray.from(JSON.parse(obj.data)), 100, 100);
    console.log(obj);
    context.putImageData(imgData, obj.x_axis, obj.y_axis);
  });
};*/

function changeStartPoint(serverX, serverY) {
  startPoint.x = serverX;
  startPoint.y = serverY;
}

// needs optimization
buttonMoveToCoord.onclick = () => {
  const coordString = $('#moveToCoordInput').val();
  const inputArr = coordString.split(',');
  changeStartPoint(parseInt(inputArr[0], 10), parseInt(inputArr[1], 10));
  onResize();
};

function init() {
  startPoint.x = randomHundred();
  startPoint.y = randomHundred();
  console.log(`startpoint : ${startPoint.x},${startPoint.y}`);
  currentStyleChange.lineJoin = 'round';
  currentStyleChange.lineCap = 'round';
  currentStyleChange.shadowBlur = 1;
  currentStyleChange.shadowColor = current.color;
  onResize();
}

var starttime;

function moveLeft(timestamp, ctx, buffer, dist, duration) {
  //if browser doesn't support requestAnimationFrame, generate our own timestamp using Date:
  var timestamp = timestamp || new Date().getTime();
  setCanMove(false);
  var runtime = timestamp - starttime;
  clearCanvas(ctx);
  var progress = runtime / duration;
  progress = Math.min(progress, 1);

  const dx = (dist * progress);
  ctx.drawImage(buffer, 100 - dx, 0, buffer.width - 100, buffer.height, 0, 0, buffer.width - 100, buffer.height);

  if (runtime < duration) { // if duration not met yet
    requestAnimationFrame(function (timestamp) { // call requestAnimationFrame again with parameters
      moveLeft(timestamp, ctx, buffer, dist, duration);
    });
  } else {
    setCanMove(true);
  }
}
function moveRight(timestamp, ctx, buffer, dist, duration) {
  //if browser doesn't support requestAnimationFrame, generate our own timestamp using Date:
  var timestamp = timestamp || new Date().getTime();
  setCanMove(false);
  var runtime = timestamp - starttime;
  clearCanvas(ctx);
  var progress = runtime / duration;
  progress = Math.min(progress, 1);

  const dx = (dist * progress);
  ctx.drawImage(buffer, dx, 0, buffer.width - 100, buffer.height, 0, 0, buffer.width - 100, buffer.height);

  if (runtime < duration) { // if duration not met yet
    requestAnimationFrame(function (timestamp) { // call requestAnimationFrame again with parameters
      moveRight(timestamp, ctx, buffer, dist, duration);
    });
  } else {
    setCanMove(true);
  }
}
function moveUp(timestamp, ctx, buffer, dist, duration) {
  //if browser doesn't support requestAnimationFrame, generate our own timestamp using Date:
  var timestamp = timestamp || new Date().getTime();
  setCanMove(false);
  var runtime = timestamp - starttime;
  clearCanvas(ctx);
  var progress = runtime / duration;
  progress = Math.min(progress, 1);

  const dy = (dist * progress);
  ctx.drawImage(buffer, 0, 100 - dy, buffer.width, buffer.height - 100, 0, 0, buffer.width, buffer.height - 100);

  if (runtime < duration) { // if duration not met yet
    requestAnimationFrame(function (timestamp) { // call requestAnimationFrame again with parameters
      moveUp(timestamp, ctx, buffer, dist, duration);
    });
  } else {
    setCanMove(true);
  }
}
function moveDown(timestamp, ctx, buffer, dist, duration) {
  //if browser doesn't support requestAnimationFrame, generate our own timestamp using Date:
  var timestamp = timestamp || new Date().getTime();
  var runtime = timestamp - starttime;
  clearCanvas(ctx);
  var progress = runtime / duration;
  progress = Math.min(progress, 1);

  const dy = (dist * progress);
  ctx.drawImage(buffer, 0, dy, buffer.width, buffer.height - 100, 0, 0, buffer.width, buffer.height - 100);

  if (runtime < duration) { // if duration not met yet
    requestAnimationFrame(function (timestamp) { // call requestAnimationFrame again with parameters
      moveDown(timestamp, ctx, buffer, dist, duration);
    });
  } else {
    setCanMove(true);
  }
}

// shouldn't be clicked when x is 0
// buttonMoveLeft.onclick = () => {
// let canMove = true;

function loadImage_Promise(src, x, y) {
  return new Promise((resolve, reject) => {
    const img = new Image(100, 100);
    let data = { data: null, dX: x, dY: y };
    img.src = src;
    img.onload = () => {
      console.log("load image: " + src);
      data.data = img;
      resolve(data);
    };
    img.onerror = () => {
      resolve(data);
    };
  });
}


function canvasMoveLeft() {
  if (!canMove) { return; }
  setCanMove(false);
  if (startPoint.x === 0) {
    alert('out of bounds!');
    setCanMove(true);
    return;
  }
  clearStyles(context);
  const buff = document.createElement('canvas');
  buff.width = canvas.width + 100;
  buff.height = canvas.height;
  // save
  buff.getContext('2d').drawImage(canvas, 100, 0);

  const promises = [];
  const leaveRoomList = [];
  const joinRoomList = [];

  if (isZoomMode()) {
    changeStartPoint(startPoint.x - (100 * (Math.pow(2, scaleSlider.noUiSlider.get() - 1))), startPoint.y);
    updateStartPointText();
    for (let i = 0; i < cSize.y; i += 1) {
      joinRoomList.push(`${toServerX(0)},${toServerY(i * 100)}`);
      leaveRoomList.push(`${toServerX(cSize.x * 100)},${toServerY(i * 100)}`);
      const src = '/' + (scaleSlider.noUiSlider.get()) + 'sc1f' + (startPoint.x) + 'c' + (startPoint.y + (i * (Math.pow(2, scaleSlider.noUiSlider.get() - 1)) * 100));
      promises.push(loadImage_Promise(src, 0, i));
    }

    return Promise.all(promises).then((results) => {
      results.forEach((e) => {
        if (e.data != null) {
          buff.getContext('2d').drawImage(e.data, (e.dX * 100), (e.dY * 100));
        }
      });
      joinRooms(joinRoomList);
      leaveRooms(leaveRoomList);
      requestAnimationFrame((timestamp) => {
        starttime = timestamp || new Date().getTime();
        moveLeft(timestamp, context, buff, 100, 200); // 400px over 1 second
      });
      setCanMove(true);
      return results;
    });
  } else { 
    changeStartPoint(startPoint.x - 100, startPoint.y);
    updateStartPointText();
    return new Promise((resolve, reject) => {
      for (let i = 0; i < cSize.y; i += 1) {
        // console.log(`get call : api/imagedatacell/coord/${toServerX(0)}/${toServerY(i * 100)}`);
        joinRoomList.push(`${toServerX(0)},${toServerY(i * 100)}`);
        leaveRoomList.push(`${toServerX(cSize.x * 100)},${toServerY(i * 100)}`);
        promises.push($.get(`/api/imagedatacell/coord/${toServerX(0)}/${toServerY(i * 100)}`).then((obj) => {
          if (obj.data == null) {
            // context.clearRect(obj.x_axis, obj.y_axis, 100, 100);
            // console.log(`no data for ${obj.x_axis}, ${obj.y_axis}`);
            cellArray[`${obj.x_axis},${obj.y_axis}`] = {
              syncNum: 0,
              imgData: null,
            };
          } else {
            const imgData = new ImageData(Uint8ClampedArray.from(JSON.parse(obj.data)), 100, 100);
            if (obj.syncNum == null) {
              cellArray[`${obj.x_axis},${obj.y_axis}`] = {
                syncNum: 0,
                imgData,
              };
            } else {
              cellArray[`${obj.x_axis},${obj.y_axis}`] = {
                syncNum: obj.syncNum,
                imgData,
              };
            }
            // console.log(obj);
            // console.log(`put : ${obj.x_axis},${obj.y_axis}`);
            buff.getContext('2d').putImageData(imgData, fromServerX(obj.x_axis), fromServerY(obj.y_axis));
          }
        }));
      }
      Promise.all(promises).then(() => {
        joinRooms(joinRoomList);
        leaveRooms(leaveRoomList);
        requestAnimationFrame((timestamp) => {
          starttime = timestamp || new Date().getTime();
          moveLeft(timestamp, context, buff, 100, 200); // 400px over 1 second
        });
        setCanMove(true);
        resolve();
      });
    });
  }
}


function canvasMoveRight() {
  if (!canMove) { return; }
  setCanMove(false);
  clearStyles(context);
  const buff = document.createElement('canvas');
  buff.width = canvas.width + 100;
  buff.height = canvas.height;

  // save
  buff.getContext('2d').drawImage(canvas, 0, 0);
  // restore
  // canvas.getContext('2d').drawImage(buffer, 0, 0);

  const promises = [];
  const leaveRoomList = [];
  const joinRoomList = [];

  if (isZoomMode()) {
    changeStartPoint(startPoint.x + (100 * (Math.pow(2, scaleSlider.noUiSlider.get() - 1))), startPoint.y);
    updateStartPointText();
    for (let i = 0; i < cSize.y; i += 1) {
      joinRoomList.push(`${toServerX(0)},${toServerY(i * scaleSlider.noUiSlider.get() * 100)}`);
      leaveRoomList.push(`${toServerX(cSize.x * scaleSlider.noUiSlider.get() * 100)},${toServerY(i * (Math.pow(2, scaleSlider.noUiSlider.get() - 1)) * 100)}`);
      const src = '/' + (scaleSlider.noUiSlider.get()) + 'sc1f' + (startPoint.x + ((cSize.x - 1) * 100 * (Math.pow(2, scaleSlider.noUiSlider.get() - 1)))) + 'c' + (startPoint.y + (i * scaleSlider.noUiSlider.get() * 100));
      promises.push(loadImage_Promise(src, cSize.x, i));
    }

    return Promise.all(promises).then((results) => {
      results.forEach((e) => {
        if (e.data != null) {
          buff.getContext('2d').drawImage(e.data, (e.dX * 100), (e.dY * 100));
        }
      });
      joinRooms(joinRoomList);
      leaveRooms(leaveRoomList);
      requestAnimationFrame((timestamp) => {
        starttime = timestamp || new Date().getTime();
        moveRight(timestamp, context, buff, 100, 200); // 400px over 1 second
      });
      setCanMove(true);
      return results;
    });
  } else { 
    changeStartPoint(startPoint.x + 100, startPoint.y);
    updateStartPointText();
    return new Promise((resolve, reject) => {
      for (let i = 0; i < cSize.y; i += 1) {
        // console.log(`get call : api/imagedatacell/coord/${toServerX((cSize.x - 1) * 100)}/${toServerY(i * 100)}`);
        joinRoomList.push(`${toServerX((cSize.x - 1) * 100)},${toServerY(i * 100)}`);
        leaveRoomList.push(`${toServerX(-100)},${toServerY(i * 100)}`);
        promises.push($.get(`/api/imagedatacell/coord/${toServerX((cSize.x - 1) * 100)}/${toServerY(i * 100)}`).then((obj) => {
          if (obj.data == null) {
            // context.clearRect(obj.x_axis, obj.y_axis, 100, 100);
            console.log(`no data for ${obj.x_axis}, ${obj.y_axis}`);
            cellArray[`${obj.x_axis},${obj.y_axis}`] = {
              syncNum: 0,
              imgData: null,
            };
          } else {
            const imgData = new ImageData(Uint8ClampedArray.from(JSON.parse(obj.data)), 100, 100);
            if (obj.syncNum == null) {
              cellArray[`${obj.x_axis},${obj.y_axis}`] = {
                syncNum: 0,
                imgData,
              };
            } else {
              cellArray[`${obj.x_axis},${obj.y_axis}`] = {
                syncNum: obj.syncNum,
                imgData,
              };
            }
            // console.log(obj);
            console.log(`put : ${obj.x_axis},${obj.y_axis}`);
            buff.getContext('2d').putImageData(imgData, fromServerX(obj.x_axis + 100), fromServerY(obj.y_axis));
          }
        }));
      }
      Promise.all(promises).then(() => {
        joinRooms(joinRoomList);
        leaveRooms(leaveRoomList);
        requestAnimationFrame((timestamp) => {
          starttime = timestamp || new Date().getTime();
          moveRight(timestamp, context, buff, 100, 200); // 400px over 1 second
        });
        resolve();
      });
    });
  }
}

function canvasMoveUp() {
  let roomlist = [];
  for (let i = 0; i < cSize.x; i += 1) {
    for (let j = 0; j < cSize.y; j += 1) {
      roomlist.push(`${toServerX(i * 100)},${toServerY(j * 100)}`);
    }
  }

  if (!canMove) { return; }
  setCanMove(false);
  if (startPoint.y === 0) {
    alert('out of bounds!');
    setCanMove(true);
    return;
  }
  clearStyles(context);
  const buff = document.createElement('canvas');
  buff.width = canvas.width;
  buff.height = canvas.height + 100;

  // save
  buff.getContext('2d').drawImage(canvas, 0, 100);

  const promises = [];
  const leaveRoomList = [];
  const joinRoomList = [];

  if (isZoomMode()) {
    changeStartPoint(startPoint.x, startPoint.y - (100 * (Math.pow(2, scaleSlider.noUiSlider.get() - 1))));
    updateStartPointText();
    for (let i = 0; i < cSize.y; i += 1) {
      joinRoomList.push(`${toServerX(i * 100)}},${toServerY(0)}`);
      leaveRoomList.push(`${toServerX(i * 100)}},${toServerY(cSize.y * 100)}`);
      const src = '/' + (scaleSlider.noUiSlider.get()) + 'sc1f' + (startPoint.x + (i * (Math.pow(2, scaleSlider.noUiSlider.get() - 1)) * 100)) + 'c' + (startPoint.y);
      promises.push(loadImage_Promise(src, i, 0));
    }

    return Promise.all(promises).then((results) => {
      results.forEach((e) => {
        if (e.data != null) {
          buff.getContext('2d').drawImage(e.data, (e.dX * 100), (e.dY * 100));
        }
      });
      joinRooms(joinRoomList);
      leaveRooms(leaveRoomList);
      requestAnimationFrame((timestamp) => {
        starttime = timestamp || new Date().getTime();
        moveUp(timestamp, context, buff, 100, 200); // 400px over 1 second
      });
      setCanMove(true);
      return results;
    });
  } else {
    changeStartPoint(startPoint.x, startPoint.y - 100);
    updateStartPointText();
    return new Promise((resolve, reject) => {
      const promises = [];
      const leaveRoomList = [];
      const joinRoomList = [];
      for (let i = 0; i < cSize.x; i += 1) {
        // console.log(`get call : api/imagedatacell/coord/${toServerX(i * 100)}/${toServerY(0)}`);
        joinRoomList.push(`${toServerX(i * 100)},${toServerY(0)}`);
        leaveRoomList.push(`${toServerX(i * 100)},${toServerY(cSize.y * 100)}`);
        promises.push($.get(`/api/imagedatacell/coord/${toServerX(i * 100)}/${toServerY(0)}`).then((obj) => {
          if (obj.data == null) {
            // context.clearRect(obj.x_axis, obj.y_axis, 100, 100);
            console.log(`no data for ${obj.x_axis}, ${obj.y_axis}`);
            cellArray[`${obj.x_axis},${obj.y_axis}`] = {
              syncNum: 0,
              imgData: null,
            };
          } else {
            const imgData = new ImageData(Uint8ClampedArray.from(JSON.parse(obj.data)), 100, 100);
            if (obj.syncNum == null) {
              cellArray[`${obj.x_axis},${obj.y_axis}`] = {
                syncNum: 0,
                imgData,
              };
            } else {
              cellArray[`${obj.x_axis},${obj.y_axis}`] = {
                syncNum: obj.syncNum,
                imgData,
              };
            }
            // console.log(obj);
            console.log(`put : ${obj.x_axis},${obj.y_axis}`);
            buff.getContext('2d').putImageData(imgData, fromServerX(obj.x_axis), fromServerY(obj.y_axis));
          }
        }));
      }
      Promise.all(promises).then(() => {
        joinRooms(joinRoomList);
        leaveRooms(leaveRoomList);
        requestAnimationFrame((timestamp) => {
          starttime = timestamp || new Date().getTime();
          moveUp(timestamp, context, buff, 100, 200); // 400px over 1 second
        });
        resolve();
      });
    });
  }
}

function canvasMoveDown() {
  if (!canMove) { return; }
  setCanMove(false);
  clearStyles(context);
  const buff = document.createElement('canvas');
  buff.width = canvas.width;
  buff.height = canvas.height + 100;

  // save
  buff.getContext('2d').drawImage(canvas, 0, 0);
  // restore
  // canvas.getContext('2d').drawImage(buffer, 0, 0);
  const promises = [];
  const leaveRoomList = [];
  const joinRoomList = [];

  if (isZoomMode()) {
    changeStartPoint(startPoint.x, startPoint.y + (100 * (Math.pow(2, scaleSlider.noUiSlider.get() - 1))));
    updateStartPointText();
    for (let i = 0; i < cSize.y; i += 1) {
      joinRoomList.push(`${toServerX(i * 100)},${toServerY((cSize.y - 1) * (Math.pow(2, scaleSlider.noUiSlider.get() - 1)) * 100)}`);
      leaveRoomList.push(`${toServerX(i * 100)},${toServerY(-100)}`);
      const src = '/' + (scaleSlider.noUiSlider.get()) + 'sc1f' + (startPoint.x + (i * (Math.pow(2, scaleSlider.noUiSlider.get() - 1)) * 100)) + 'c' + (startPoint.y + ((cSize.y - 1) * (Math.pow(2, scaleSlider.noUiSlider.get() - 1)) * 100));
      promises.push(loadImage_Promise(src, i, cSize.y));
    }

    return Promise.all(promises).then((results) => {
      results.forEach((e) => {
        if (e.data != null) {
          buff.getContext('2d').drawImage(e.data, (e.dX * 100), (e.dY * 100));
        }
      });
      joinRooms(joinRoomList);
      leaveRooms(leaveRoomList);
      requestAnimationFrame((timestamp) => {
        starttime = timestamp || new Date().getTime();
        moveDown(timestamp, context, buff, 100, 200); // 400px over 1 second
      });
      setCanMove(true);
      return results;
    });
  } else {
    changeStartPoint(startPoint.x, startPoint.y + 100);
    updateStartPointText();
    return new Promise((resolve, reject) => {
      const promises = [];
      const leaveRoomList = [];
      const joinRoomList = [];
      for (let i = 0; i < cSize.x; i += 1) {
        joinRoomList.push(`${toServerX(i * 100)},${toServerY((cSize.y - 1) * 100)}`);
        leaveRoomList.push(`${toServerX(i * 100)},${toServerY(-100)}`);
        // console.log(`get call : api/imagedatacell/coord/${toServerX(i * 100)}/${toServerY((cSize.y - 1) * 100)}`);
        promises.push($.get(`/api/imagedatacell/coord/${toServerX(i * 100)}/${toServerY((cSize.y - 1) * 100)}`).then((obj) => {
          if (obj.data == null) {
            // context.clearRect(obj.x_axis, obj.y_axis, 100, 100);
            console.log(`no data for ${obj.x_axis}, ${obj.y_axis}`);
            cellArray[`${obj.x_axis},${obj.y_axis}`] = {
              syncNum: 0,
              imgData: null,
            };
          } else {
            const imgData = new ImageData(Uint8ClampedArray.from(JSON.parse(obj.data)), 100, 100);
            if (obj.syncNum == null) {
              cellArray[`${obj.x_axis},${obj.y_axis}`] = {
                syncNum: 0,
                imgData,
              };
            } else {
              cellArray[`${obj.x_axis},${obj.y_axis}`] = {
                syncNum: obj.syncNum,
                imgData,
              };
            }
            // console.log(obj);
            console.log(`put : ${obj.x_axis},${obj.y_axis}`);
            buff.getContext('2d').putImageData(imgData, fromServerX(obj.x_axis), fromServerY(obj.y_axis + 100));
          }
        }));
      }
      Promise.all(promises).then(() => {
        joinRooms(joinRoomList);
        leaveRooms(leaveRoomList);
        requestAnimationFrame((timestamp) => {
          starttime = timestamp || new Date().getTime();
          moveDown(timestamp, context, buff, 100, 200); // 400px over 1 second
        });
        resolve();
      });
    });
  }
}

// touch

// should prevent scrolling


const touchStart = Rx.Observable.fromEvent(canvas, 'touchstart');
const touchMove = Rx.Observable.fromEvent(canvas, 'touchmove');
const touchEnd = Rx.Observable.fromEvent(canvas, 'touchend');
const touchLeave = Rx.Observable.fromEvent(canvas, 'touchleave');

const subscribeTouchStart = touchStart.subscribe((e) => {
  e.preventDefault();
  if (grabFlag === true) {
    mouseDownPoint.x = correctX(e.touches[0].clientX);
    mouseDownPoint.y = correctY(e.touches[0].clientY);
  } else {
    // if (!drawFlag) { return; }
    console.log('touchstart');
    drawFlag = true;
    current.x = correctX(e.touches[0].clientX);
    console.log(e.touches[0].clientX);
    current.y = correctY(e.touches[0].clientY);
    setCellSwitchOn(toServerX(current.x), toServerY(current.y));
  }
});

const subscribeTouchEnd = touchEnd.subscribe((e) => {
  e.preventDefault();
  console.log('touchend');
  console.log(e);
  if (!drawFlag) { return; }
  drawFlag = false;
  drawLine(current.x, current.y, correctX(e.changedTouches[0].pageX), correctY(e.changedTouches[0].pageY), current.color, currentStyleChange, true, brushStyle);
  updateModifiedCells();
});

const subscribeTouchMove = touchMove.subscribe((e) => {
  if (grabFlag === true) {
    if (correctX(e.touches[0].clientX) - 100 > mouseDownPoint.x) {
      canvasMoveLeft();
      mouseDownPoint = {};
    } else if (correctX(e.touches[0].clientX) + 100 < mouseDownPoint.x) {
      canvasMoveRight();
      mouseDownPoint = {};
    } else if (correctY(e.touches[0].clientY) - 100 > mouseDownPoint.y) {
      canvasMoveUp();
      mouseDownPoint = {};
    } else if (correctY(e.touches[0].clientY) + 100 < mouseDownPoint.y) {
      canvasMoveDown();
      mouseDownPoint = {};
    }
  }
  e.preventDefault();
  console.log('touchmove');
  if (!drawFlag) { return; }
  // console.log(correctX(e.clientX) + ',' + correctY(e.clientY));
  drawLine(current.x, current.y, correctX(e.touches[0].clientX), correctY(e.touches[0].clientY), current.color, currentStyleChange, true, brushStyle);
  current.x = correctX(e.touches[0].clientX);
  current.y = correctY(e.touches[0].clientY);
  setCellSwitchOn(toServerX(current.x), toServerY(current.y));
});

const subscribeTouchLeave = touchLeave.subscribe((e) => {
  e.preventDefault();
  console.log('touchleave');
  if (!drawFlag) { return; }
  drawFlag = false;
  drawLine(current.x, current.y, correctX(e.touches[0].clientX), correctY(e.touches[0].clientY), current.color, currentStyleChange, true, brushStyle);
  updateModifiedCells();
});

///// canvas wheel event ////////////
canvas.onmousewheel = (event) => {  
  if (!canMove) return;
  if (event.wheelDelta >= 120) {
    scaleSlider.noUiSlider.set(scaleSlider.noUiSlider.get() + 1);
    grabFlag = true;
    canvas.style.cursor = 'move';
    startPoint.x = startPoint.x - (startPoint.x % (Math.pow(2, scaleSlider.noUiSlider.get() - 1) * 100));
    startPoint.y = startPoint.y - (startPoint.y % (Math.pow(2, scaleSlider.noUiSlider.get() - 1) * 100));
    updateStartPointText();
    onResize();
  } else if (event.wheelDelta <= -120) {
    if (scaleSlider.noUiSlider.get() === 1) return;
    
    scaleSlider.noUiSlider.set(scaleSlider.noUiSlider.get() - 1);
    startPoint.x = startPoint.x - (startPoint.x % (Math.pow(2, scaleSlider.noUiSlider.get() - 1) * 100));
    startPoint.y = startPoint.y - (startPoint.y % (Math.pow(2, scaleSlider.noUiSlider.get() - 1) * 100));
    updateStartPointText();
    onResize();
  }
};

scaleSlider.noUiSlider.on('change', (e) => {
  if (scaleSlider.noUiSlider.get() !== 1){
    grabFlag = true;
    canvas.style.cursor = 'move';  
  }
	startPoint.x = startPoint.x - (startPoint.x % (Math.pow(2, scaleSlider.noUiSlider.get() - 1) * 100));
  startPoint.y = startPoint.y - (startPoint.y % (Math.pow(2, scaleSlider.noUiSlider.get() - 1) * 100));
  updateStartPointText();
  onResize();
});


// window.addEventListener('resize', onResize, false);
init();


// /////////////////////////////////////////////////////////////////////////////////////////////////
