const PaintChunk = require('../models/PaintChunk');
const debug = require('debug')('paintchunkcontroller');
const fs = require('fs');

exports.paintchunk_create_post = function (req, res) {
  req.checkBody('x_axis', 'x_axis required').notEmpty();
  req.checkBody('y_axis', 'y_axis required').notEmpty();
  req.checkBody('svgdata', 'svgdata required').notEmpty();

  req.sanitize('x_axis').escape();
  req.sanitize('x_axis').trim();
  req.sanitize('y_axis').escape();
  req.sanitize('y_axis').trim();

  const errors = req.validationErrors();

  // debug('here!1');
  // debug(req.body.data);

  // debug('here!2');
  if (errors) {
    debug('errors in validation : ');
  } else {
    const xAxis = req.body.x_axis;
    const yAxis = req.body.y_axis;
    const theOwner = req.body.owner;
    const createdUrl = `../data/chunks/${xAxis}_${yAxis}_${theOwner}`;
    fs.writeFile(createdUrl, req.body.svgdata, (err) => {
      if (err) throw err;
    });

    const freshPaintChunk = new PaintChunk({
      x_axis: req.body.x_axis,
      y_axis: req.body.y_axis,
      owner: req.body.owner,
      accessType: req.body.accessType,
      dataUrl: createdUrl,
    });

    freshPaintChunk.save(function (err) {
      if (err) { return next(err); }
      debug('fresh paint chunk saved!');
    }).then((saved) => {
      res.json(saved);
    }, (err) => {
      debug(`save err : ${err}`);
      res.send(`rejected : ${err}`);
    });
  }
};

exports.paintchunk_detail = function (req, res) {
  PaintChunk.findById(req.params.id).exec().then((chunk) => {
    res.json(chunk);
  }, (err) => {
    // need better error handling
    debug(err);
    res.send(`error with finding ${err}`);
  });
};

exports.paintchunk_save = (xAxis, yAxis, data) => {
  const freshPaintChunk = new PaintChunk({
    x_axis: xAxis,
    y_axis: yAxis,
    owner: null,
    accessType: null,
    data,
  });

  PaintChunk.findOneAndUpdate({
    x_axis: xAxis,
    y_axis: yAxis,
  }, { data : data }).exec().then((foundCell) => {
    if (foundCell === null) {
      freshPaintChunk.save(function (err) {
        if (err) {
          debug(err);
          return null;
        }
        debug('fresh data cell saved!');
      }).then(saved => saved, (err) => {
        debug(`save err :'${err}`);
        return null;
      });
    } else {
      return foundCell;
    }
  }, (err) => {
    debug(`findOne err : ${err}`);
    return null;
  });
};

exports.paintchunk_json_find_by_coordinates = (req, res) => {
  PaintChunk.findOne({
    x_axis: req.params.xAxis,
    y_axis: req.params.yAxis,
  }).exec().then((chunk) => {
    // if nothing exists a cell with null data returns.
    if (chunk == null) {
      res.json(null);
    } else {
      res.contentType = 'text/plain';
      res.send(chunk.data);
    }
  }, (err) => {
    // need better error handling
    debug(err);
    res.send(`error with finding ${err}`);
  });
};

exports.paintchunk_json_find_by_coordinates_ne = (xAxis, yAxis) => {
  PaintChunk.findOne({
    x_axis: xAxis,
    y_axis: yAxis,
  }).exec().then((chunk) => {
    // if nothing exists a cell with null data returns.
    if (chunk == null) {
      return null;
    }
    return chunk.data;
  }, (err) => {
    // need better error handling
    debug(err);
    return null;
  });
};
