const debug = require("debug")("pngConvertModule");
const sharp = require("sharp");
const fabric = require("fabric").fabric;
const PaintChunk = require("../models/PaintChunk");
const PaintPng = require("../models/PaintPng");
const paintPngController = require("../controllers/paintPngController");
const mongoose = require("mongoose");
//const pngs = {};
const mongoDB = "mongodb://127.0.0.1:27017/bigpicture";

const CANVAS_SIZE = 4096;
mongoose.connect(mongoDB);



function updatePng(x, y, size) {
  //const png = target.toDataURL({ width: CANVAS_SIZE, height: CANVAS_SIZE });
  debug(`came in updatepng ${x},${y}`);

  PaintChunk.findOne({
    x_axis: x,
    y_axis: y,
  }).exec().then((chunk) => {
    // if nothing exists a cell with null data returns.
    if (chunk != null) {
      const tempCanvas = fabric.createCanvasForNode(CANVAS_SIZE, CANVAS_SIZE);
      tempCanvas.loadFromJSON(chunk.data, (done) => {
        const dataUrl = tempCanvas.toDataURL({ width: CANVAS_SIZE, height: CANVAS_SIZE });
        const modPng = dataUrl.substring(22, dataUrl.length);
        //console.log(modPng);
        sharp(new Buffer(modPng, "base64"))
          .resize(size, size)
          .toBuffer()
          .then(result => {
            debug(`done resize png ${x},${y}`);
            //console.log(`png update done ${x},${y}`)
            paintPngController.paintpng_save(x, y, size, result.toString("base64")).then(() => {
              //debug(result);
              debug(`done update png ${x},${y}`)
            });
            //pngs[`${x},${y}`] = result.toString("base64");
          }).catch(err => { debug(err) });
      });
    } else {
      debug("null chunk");
    }
  }).catch((err) => {
    debug(err);
  });


}

process.on("message", (obj) => {
  updatePng(obj.x, obj.y, obj.size);
});