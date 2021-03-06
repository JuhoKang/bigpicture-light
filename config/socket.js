const PaintChunk = require("../models/PaintChunk");
const PaintPng = require("../models/PaintPng");
const debug = require("debug")("socket");
const paintChunkController = require("../controllers/paintChunkController");
const paintPngController = require("../controllers/paintPngController");
const sharp = require("sharp");
const fabric = require("fabric").fabric;
const cp = require("child_process");

const pngConvertModule = cp.fork("./config/pngConvertModule");
const chunkSaveModule = cp.fork("./config/chunkSaveModule");


const MAX_CHUNK_HEALTH = 3;
const CHUNK_UPDATE_MILLSEC_TIME = 30000;
const CANVAS_SIZE = 4096;

module.exports = function (server) {
  const chunks = {};
  const routineHealth = {};
  const routineInterval = {};

  const pngs = {};

  function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
  }

  //getRandomAppropriateIntervalTime
  //get a interval time to avoid too many same intervals.
  function getRait() {
    return getRandomIntInclusive(30, 50) * 1000;
  }

  function updateRoutine(x, y) {
    debug(`update routine fired ${x},${y} : routineHealth is : ${routineHealth[`${x},${y}`]}`);
    const target = chunks[`${x},${y}`];
    if (target != null) {
      pngConvertModule.send({ x: x, y: y, size: 64 });
      debug(`update routine done dataUrl${x},${y}`);
      chunkSaveModule.send({ target: chunks[`${x},${y}`], x, y });
      debug(`update routine done targetchunk sending ${x},${y}`);
      if (routineHealth[`${x},${y}`] <= 0) {
        clearInterval(routineInterval[`${x},${y}`]);
        chunks[`${x},${y}`] = null;
        routineInterval[`${x},${y}`] = null;
      } else {
        routineHealth[`${x},${y}`] -= 1;
      }
    } else {
      clearInterval(routineInterval[`${x},${y}`]);
      chunks[`${x},${y}`] = null;
      routineInterval[`${x},${y}`] = null;
    }
    debug(`update routine done ${x},${y}`);
  }

  function updatePng(target, x, y, size) {
    if (target != null) {
      const png = target.toDataURL({ width: CANVAS_SIZE, height: CANVAS_SIZE });
      debug("came in updatepng");
      //png has a start with data:image/png;base64, (substring to delete this)
      const modPng = png.substring(22, png.length);
      //console.log(modPng);
      sharp(new Buffer(modPng, "base64"))
        .resize(size, size)
        .toBuffer()
        .then(result => {
          debug(`png update done ${x},${y}`)
          paintPngController.paintpng_save(x, y, size, pngs[`${x},${y}`]);
          pngs[`${x},${y}`] = result.toString("base64");
        }).catch(err => { debug(err) });
    }
  }

  function updateChunk(x, y) {
    debug(`update chunk ${x},${y} : chunkHealth is : ${chunkHealth[`${x},${y}`]}`);
    const target = chunks[`${x},${y}`];
    if (target != null) {
      pngConvertModule.send({ dataUrl: target.toDataURL({ width: CANVAS_SIZE, height: CANVAS_SIZE }), x: x, y: y, size: 64 });
      paintChunkController.paintchunk_save(x, y, JSON.stringify(target)).then((result) => {
        if (chunkHealth[`${x},${y}`] < 0) {
          clearInterval(chunkInterval[`${x},${y}`]);
          chunks[`${x},${y}`] = null;
          chunkInterval[`${x},${y}`] = null;
        } else {
          chunkHealth[`${x},${y}`] -= 1;
        }
      });
    } else {
      clearInterval(chunkInterval[`${x},${y}`]);
      chunks[`${x},${y}`] = null;
      chunkInterval[`${x},${y}`] = null;
    }
  }

  let io = require("socket.io")(server);

  function initChunk(x, y) {
    return new Promise((resolve, reject) => {
      debug(`init chunk ${x},${y}`)
      if (chunks[`${x},${y}`] == null) {
        //get data from database
        PaintChunk.findOne({
          x_axis: x,
          y_axis: y,
        }).exec().then((chunk) => {
          // if nothing exists a cell with null data returns.
          if (chunk != null) {
            chunks[`${x},${y}`] = fabric.createCanvasForNode(CANVAS_SIZE, CANVAS_SIZE);
            chunks[`${x},${y}`].loadFromJSON(chunk.data, (done) => {
              resolve(chunks[`${x},${y}`]);
            });
          } else {
            resolve("chunk is null");
            //no chunk data from database
            //console.log("chunk is null");
          }
        }, (err) => {
          debug(err);
          reject(err);
          // need better error handling
          debug(err);
        });

        routineHealth[`${x},${y}`] = MAX_CHUNK_HEALTH;
        if (routineInterval[`${x},${y}`] == null) {
          const interval = setInterval(() => {
            updateRoutine(x, y);
          }, getRait());
          routineInterval[`${x},${y}`] = interval;
        }
      } else {
        resolve(`${x},${y}`);
        //chunk is already intialized
      }
    });
  }

  io.on("connection", function (socket) {

    socket.on("getChunkData", (data) => {
      //no chunk hit on memory
      if (chunks[`${data.x},${data.y}`] == null) {
        initChunk(data.x, data.y).then((chunk) => {
          if (data.isMain) {
            socket.emit("mainChunkSend", { x: data.x, y: data.y, json: JSON.stringify(chunks[`${data.x},${data.y}`]) });
          } else {
            socket.emit("otherChunkSend", { x: data.x, y: data.y, json: JSON.stringify(chunks[`${data.x},${data.y}`]) });
          }
        }).catch(() => {
          debug("chunk is null")
        });
      } else {
        if (data.isMain) {
          socket.emit("mainChunkSend", { x: data.x, y: data.y, json: JSON.stringify(chunks[`${data.x},${data.y}`]) });
        } else {
          socket.emit("otherChunkSend", { x: data.x, y: data.y, json: JSON.stringify(chunks[`${data.x},${data.y}`]) });
        }
      }
    });

    socket.on('joinRoom', (coord) => {
      socket.join(`chunk_room:${coord.x},${coord.y}`);
    });

    socket.on('drawToRoom', (data) => {
      socket.broadcast.to(`paint_room:${data.coord}`).emit('drawing', data.drawData);
    });

    socket.on('drawToChunk', (data) => {
      //no chunk hit on memory
      if (chunks[`${data.xAxis},${data.yAxis}`] == null) {
        //console.log(`${data.xAxis},${data.yAxis} : is null`);
        //MAX_CHUNK_HEALTH
        chunks[`${data.xAxis},${data.yAxis}`] = fabric.createCanvasForNode(CANVAS_SIZE, CANVAS_SIZE);

        PaintChunk.findOne({
          x_axis: data.xAxis,
          y_axis: data.yAxis,
        }).exec().then((chunk) => {
          // if nothing exists a cell with null data returns.
          if (chunk != null) {
            chunks[`${data.xAxis},${data.yAxis}`].loadFromJSON(chunk.data);
            fabric.util.enlivenObjects([data.data], (objects) => {
              objects.forEach((obj) => {
                obj.left = data.serverLeft;
                obj.top = data.serverTop;
                obj.owner = data.uid;
                chunks[`${data.xAxis},${data.yAxis}`].add(obj);
              });
            });
          }
        }, (err) => {
          // need better error handling
          debug(err);
        });

        //initialize chunkHealth when initilizing chunk
        routineHealth[`${data.x},${data.y}`] = MAX_CHUNK_HEALTH;
        const interval = setInterval(() => {
          updateRoutine(data.xAxis, data.yAxis);
        }, getRait());
        routineInterval[`${data.x},${data.y}`] = interval;

      } else {
        //reInitialize chunkHealth when user draws.
        routineHealth[`${data.xAxis},${data.yAxis}`] = MAX_CHUNK_HEALTH;

        fabric.util.enlivenObjects([data.data], (objects) => {
          objects.forEach((obj) => {
            obj.left = data.serverLeft;
            obj.top = data.serverTop;
            obj.owner = data.uid;
            chunks[`${data.xAxis},${data.yAxis}`].add(obj);
          });
        });
      }

      socket.broadcast.to(`chunk_room:${data.xAxis},${data.yAxis}`).emit("objectFromOther", {
        data: data.data,
        uid: data.uid,
      });

    });

    socket.on("removeObject", (data) => {
      if (chunks[`${data.xAxis},${data.yAxis}`] != null) {
        let chunkObjects = chunks[`${data.xAxis},${data.yAxis}`].getObjects();
        for (let i = chunkObjects.length - 1; i > -1; i--) {
          if (chunkObjects[i].owner === data.uid) {
            chunks[`${data.xAxis},${data.yAxis}`].remove(chunkObjects[i]);
            socket.broadcast.to(`chunk_room:${data.xAxis},${data.yAxis}`).emit("undoFromOther", data.uid);
            break;
          }
        }
      }
    });

    socket.on("getPng", (data) => {

      PaintPng.findOne({
        x_axis: data.xAxis,
        y_axis: data.yAxis,
        size: data.size,
      }).exec().then((png) => {
        if (png != null) {
          pngs[`${data.xAxis},${data.yAxis}`] = png.b64_png;
          socket.emit("pngHit", { x: data.xAxis, y: data.yAxis, size: data.size, pngData: png.b64_png });
        }
      }).catch((reject) => {

      });
    });

    socket.on("leaveRoom", (data) => {
      socket.leave(`chunk_room:${data.xAxis},${data.yAxis}`);
    });

    socket.on("fromclient", function (data) {
      let msg = {
        from: {
          name: data.username,
        },
        type: data.type,
        msg: data.msg
      };
      const theRooms = Object.keys(socket.rooms);
      const destUsers = [];
      for (let i = 0; i < theRooms.length; i += 1) {
        const dirtyUsers = io.sockets.adapter.rooms[theRooms[i]].sockets;
        const dirtyUsersKeys = Object.keys(dirtyUsers);
        for (let j = 0; j < dirtyUsersKeys.length; j += 1) {
          if (destUsers[dirtyUsersKeys[j]] !== true) {
            destUsers[dirtyUsersKeys[j]] = true;
          }
        }
      }

      const destUsersKeys = Object.keys(destUsers);
      for (let i = 0; i < destUsersKeys.length; i += 1) {
        socket.broadcast.to(destUsersKeys[i]).emit("toclient", msg);
      }
    });

    socket.on("sendPing", (ping) => {
      //debug(ping);
      socket.broadcast.emit("receivePing", ping);
    });

  });
};
