let http = require('http');
const imageDataCellController = require('../controllers/imageDataCellController');
const ImageDataCell = require('../models/ImageDataCell');
const PaintChunk = require('../models/PaintChunk');
const paintChunkController = require('../controllers/paintChunkController');
const fabric = require('fabric').fabric;
const fs = require('fs');

const MAX_CHUNK_HEALTH = 3;

module.exports = function (server) {
  const chunks = {};
  const chunkHealth = {};
  const chunkInterval = {};

  function updateChunk(x, y) {
    console.log(`update chunk ${x},${y} : chunkHealth is : ${chunkHealth[`${x},${y}`]}`);
    const target = chunks[`${x},${y}`];
    paintChunkController.paintchunk_save(x, y, JSON.stringify(target));
    if(chunkHealth[`${x},${y}`] < 0) {
      chunks[`${x},${y}`] = null;
      clearInterval(chunkInterval[`${x},${y}`]);
      chunkInterval[`${x},${y}`] = null;
    } else {
      console.log(`hello`);
      chunkHealth[`${x},${y}`] = chunkHealth[`${x},${y}`] - 1;
    }
  }

  let io = require('socket.io')(server);

  io.on('connection', function (socket) {
    
    socket.on('getChunkData', (data) => {
      //no chunk hit on memory
      if (chunks[`${data.x},${data.y}`] == null) {
        chunks[`${data.x},${data.y}`] = fabric.createCanvasForNode(4096, 4096);
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
        //update intialized chunk after 30sec
        
        chunkHealth[`${data.x},${data.y}`] = MAX_CHUNK_HEALTH;
        const interval = setInterval(() => {
          updateChunk(data.x, data.y);
        }, 3000);        
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
        chunks[`${data.xAxis},${data.yAxis}`] = fabric.createCanvasForNode(4096, 4096);
        
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
                //paintChunkController.paintchunk_save(data.xAxis, data.yAxis, JSON.stringify(target));
              });
            });
          }
        }, (err) => {
          // need better error handling
          debug(err);
        });
        
        chunkHealth[`${data.x},${data.y}`] = MAX_CHUNK_HEALTH;
        const interval = setInterval(() => {
          updateChunk(data.xAxis, data.yAxis);
        }, 30000);
        chunkInterval[`${data.x},${data.y}`] = interval;
        
      } else {
        chunkHealth[`${data.x},${data.y}`] = MAX_CHUNK_HEALTH;

        fabric.util.enlivenObjects([data.data], (objects) => {
          objects.forEach((obj) => {
            obj.left = data.serverLeft;
            obj.top = data.serverTop;
            obj.owner = data.uid;
            chunks[`${data.xAxis},${data.yAxis}`].add(obj);
            paintChunkController.paintchunk_save(data.xAxis, data.yAxis, JSON.stringify(chunks[`${data.xAxis},${data.yAxis}`]));
          });
        });
      }

      socket.broadcast.to(`chunk_room:${data.xAxis},${data.yAxis}`).emit('objectFromOther', {
        data: data.data,
        uid: data.uid,
      });
    });

    socket.on('removeObject', (data) => {
      console.log(`${data.xAxis},${data.yAxis}`);
      console.log('hello');
      let chunkObjects = chunks[`${data.xAxis},${data.yAxis}`].getObjects();
      console.log(chunkObjects.length);
      console.log(chunkObjects[chunkObjects.length-1].owner);

      for(let i = chunkObjects.length - 1; i > -1; i--) {
        if(chunkObjects[i].owner === data.uid) {
          console.log(data.uid);
          console.log('remove');
          chunks[`${data.xAxis},${data.yAxis}`].remove(chunkObjects[i]);
          socket.emit
          socket.broadcast.to(`chunk_room:${data.xAxis},${data.yAxis}`).emit('undoFromOther', data.uid );
          break;
        }
      }
      console.log(chunkObjects.length);
    });

    socket.on('leaveRoom', (data) => {
      socket.leave(`chunk_room:${data.xAxis},${data.yAxis}`);
    });

    socket.on('fromclient', function (data) {
      let msg = {
        from: {
          name: data.username,
        },
        msg: data.msg,
        id: data.id,
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
