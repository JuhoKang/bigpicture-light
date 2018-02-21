const PaintChunk = require("../models/PaintPng");
const debug = require("debug")("paintpngcontroller");

exports.paintpng_save = (xAxis, yAxis, size, base64) => {
  return new Promise((resolve, reject) => {
    const freshPaintChunk = new PaintChunk({
      x_axis: xAxis,
      y_axis: yAxis,
      size: size,
      base64: base64,
    });

    PaintPng.findOneAndUpdate({
      x_axis: xAxis,
      y_axis: yAxis,
      size: size,
    }, { base64: base64 }).exec().then((foundCell) => {
      if (foundCell === null) {
        freshPaintChunk.save(function (err) {
          if (err) {
            debug(err);
            reject("findOne err1");
            return null;
          }
          debug("fresh png data saved!");
        }).then(saved => saved, (err) => {
          reject("findOne err2");
          debug(`save err :"${err}`);
          return null;
        });
      } else {
        resolve(foundCell);
        return foundCell;
      }
    }, (err) => {
      debug(`findOne err : ${err}`);
      reject("findOne err3");
      return null;
    });
  });
};