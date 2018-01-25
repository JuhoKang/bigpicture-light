const PaintChunk = require('../models/PaintChunk');
const debug = require('debug')('socket');
const paintChunkController = require('../controllers/paintChunkController');
const fabric = require('fabric').fabric;

const MAX_CHUNK_HEALTH = 3;
const CHUNK_UPDATE_MILLSEC_TIME = 10000;
const CANVAS_SIZE = 4096;

module.exports = function (server) {
  const chunks = {};
  const chunkHealth = {};
  const chunkInterval = {};

  function updateChunk(x, y) {
    debug(`update chunk ${x},${y} : chunkHealth is : ${chunkHealth[`${x},${y}`]}`);
    const target = chunks[`${x},${y}`];
    paintChunkController.paintchunk_save(x, y, JSON.stringify(target)).then((x) => {
      if (chunkHealth[`${x},${y}`] < 0) {
        clearInterval(chunkInterval[`${x},${y}`]);
        chunks[`${x},${y}`] = null;
        chunkInterval[`${x},${y}`] = null;
      } else {
        chunkHealth[`${x},${y}`] -= 1;
      }
    });
  }

  let io = require('socket.io')(server);

  io.on('connection', function (socket) {

    socket.on('getChunkData', (data) => {
      //no chunk hit on memory
      if (chunks[`${data.x},${data.y}`] == null) {
        chunks[`${data.x},${data.y}`] = fabric.createCanvasForNode(CANVAS_SIZE, CANVAS_SIZE);
        //get data from database
        PaintChunk.findOne({
          x_axis: data.x,
          y_axis: data.y,
        }).exec().then((chunk) => {
          // if nothing exists a cell with null data returns.
          if (chunk != null) {
            chunks[`${data.x},${data.y}`].loadFromJSON(chunk.data);
            if (data.isMain) {
              socket.emit('mainChunkSend', { x: data.x, y: data.y, json: JSON.stringify(chunks[`${data.x},${data.y}`]) });
            } else {
              socket.emit('otherChunkSend', { x: data.x, y: data.y, json: JSON.stringify(chunks[`${data.x},${data.y}`]) });
            }
          } else {
            //no chunk data from database
            //console.log('chunk is null');
          }
        }, (err) => {
          // need better error handling
          debug(err);
        });

        //initialize chunkHealth when initilizing chunk
        chunkHealth[`${data.x},${data.y}`] = MAX_CHUNK_HEALTH;
        const interval = setInterval(() => {
          updateChunk(data.x, data.y);
        }, CHUNK_UPDATE_MILLSEC_TIME);
        chunkInterval[`${data.x},${data.y}`] = interval;
      } else {
        if (data.isMain) {
          socket.emit('mainChunkSend', { x: data.x, y: data.y, json: JSON.stringify(chunks[`${data.x},${data.y}`]) });
        } else {
          socket.emit('otherChunkSend', { x: data.x, y: data.y, json: JSON.stringify(chunks[`${data.x},${data.y}`]) });
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
        MAX_CHUNK_HEALTH
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
        chunkHealth[`${data.x},${data.y}`] = MAX_CHUNK_HEALTH;
        const interval = setInterval(() => {
          updateChunk(data.xAxis, data.yAxis);
        }, CHUNK_UPDATE_MILLSEC_TIME);
        chunkInterval[`${data.x},${data.y}`] = interval;

      } else {
        //reInitialize chunkHealth when user draws.
        chunkHealth[`${data.xAxis},${data.yAxis}`] = MAX_CHUNK_HEALTH;

        fabric.util.enlivenObjects([data.data], (objects) => {
          objects.forEach((obj) => {
            obj.left = data.serverLeft;
            obj.top = data.serverTop;
            obj.owner = data.uid;
            chunks[`${data.xAxis},${data.yAxis}`].add(obj);
          });
        });
      }

      socket.broadcast.to(`chunk_room:${data.xAxis},${data.yAxis}`).emit('objectFromOther', {
        data: data.data,
        uid: data.uid,
      });

    });

    socket.on('removeObject', (data) => {
      let chunkObjects = chunks[`${data.xAxis},${data.yAxis}`].getObjects();
      for (let i = chunkObjects.length - 1; i > -1; i--) {
        if (chunkObjects[i].owner === data.uid) {
          chunks[`${data.xAxis},${data.yAxis}`].remove(chunkObjects[i]);
          socket.broadcast.to(`chunk_room:${data.xAxis},${data.yAxis}`).emit('undoFromOther', data.uid);
          break;
        }
      }
    });

    socket.on('leaveRoom', (data) => {
      socket.leave(`chunk_room:${data.xAxis},${data.yAxis}`);
    });

    socket.on('fromclient', function (data) {
      let msg = {
        from: {
          name: data.username,
        },
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
        socket.broadcast.to(destUsersKeys[i]).emit('toclient', msg);
      }
    });
  });
};
