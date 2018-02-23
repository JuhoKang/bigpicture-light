const debug = require("debug")("pngConvertModule");
const sharp = require("sharp");
const PaintPng = require("../models/PaintPng");
const paintPngController = require("../controllers/paintPngController");
const mongoose = require("mongoose");
//const pngs = {};
const mongoDB = "mongodb://127.0.0.1:27017/bigpicture";

mongoose.connect(mongoDB);

function updatePng(dataUrl, x, y, size) {
  //const png = target.toDataURL({ width: CANVAS_SIZE, height: CANVAS_SIZE });
  debug("came in updatepng");
  const modPng = dataUrl.substring(22, dataUrl.length);
  //console.log(modPng);
  sharp(new Buffer(modPng, "base64"))
    .resize(size, size)
    .toBuffer()
    .then(result => {
      //console.log(`png update done ${x},${y}`)
      paintPngController.paintpng_save(x, y, size, result);
      //pngs[`${x},${y}`] = result.toString("base64");
    }).catch(err => { console.log(err) });
}

process.on("message", (obj) => {
  updatePng(obj.dataUrl, obj.x, obj.y, obj.size);
});