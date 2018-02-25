const PaintChunk = require("../models/PaintChunk");
const debug = require("debug")("chunkSaveModule");
const paintChunkController = require("../controllers/paintChunkController");
const mongoose = require("mongoose");


const MAX_CHUNK_HEALTH = 3;
const CHUNK_UPDATE_MILLSEC_TIME = 5000;
const CANVAS_SIZE = 4096;

const mongoDB = "mongodb://127.0.0.1:27017/bigpicture";
mongoose.connect(mongoDB);
function updateChunk(target, x, y) {
  debug(`update chunk inside module ${x},${y}`);
  if (target != null) {
    paintChunkController.paintchunk_save(x, y, JSON.stringify(target)).then((result) => {
      debug(`done update chunk ${x},${y}`);
    });
  }
}

process.on("message", (obj) => {
  updateChunk(obj.target, obj.x, obj.y);
});