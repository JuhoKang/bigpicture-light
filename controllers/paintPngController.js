const PaintPng = require("../models/PaintPng");
const debug = require("debug")("paintpngcontroller");

exports.paintpng_save = (xAxis, yAxis, size, base64) => {
  return new Promise((resolve, reject) => {
    const freshPaintPng = new PaintPng({
      x_axis: xAxis,
      y_axis: yAxis,
      size: size,
      base64: base64,
    });
    debug(freshPaintPng);
    debug(`came here but ${xAxis}, ${yAxis}, ${size}, ${base64}`);
    PaintPng.findOneAndUpdate({
      x_axis: xAxis,
      y_axis: yAxis,
      size: size,
    }, { base64: base64 }, {upsert:true}).exec().then((foundCell) => {
      debug("done something");
      if (foundCell === null) {
        debug("not found")
        freshPaintPng.save(function (err) {
          if (err) {
            debug(err);
            reject("findOne err1");
            return null;
          }
          debug("fresh png data saved!");
        }).then((saved) => {
          debug(saved);
        }, (err) => {
          reject("findOne err2");
          debug(`save err :"${err}`);
          return null;
        });
      } else {
        debug("found!!")
        debug(foundCell);
        resolve(foundCell);
        return foundCell;
      }
    }
    /*, (err) => {
      debug(`findOne err : ${err}`);
      reject("findOne err3");
      return null;}*/
    ).catch((reject)=> {
      debug("reject");
      debug(reject);
    });
  });
};