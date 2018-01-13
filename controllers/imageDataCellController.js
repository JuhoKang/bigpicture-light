const ImageDataCell = require('../models/ImageDataCell');
const Timer = require('../config/timer');
const debug = require('debug')('imagedatacell');
const fs = require('fs');

// not for route
exports.getImageDataCellSyncNum = (x, y) => {
  ImageDataCell.findOne({
    x_axis: x,
    y_axis: y,
  }).select('syncNum').exec().then((result) => {
    // if nothing exists null returns.
    console.log(result);
    if (result.syncNum == null) {
      return 0;
    }
    return result.syncNum;
  }, (err) => {
    // need better error handling
    debug(err);
  });
};

// Display list of all ImageDataCells
exports.imagedatacell_list = function (req, res, next) {
  debug('called debug');
  res.send('NOT IMPLEMENTED: ImageDataCell list GET');
};

exports.imagedatacell_detail = function (req, res, next) {
  ImageDataCell.findById(req.params.id).exec().then((cell) => {
    res.json(cell);
  }, (err) => {
    // need better error handling
    debug(err);
    res.send(`error with finding ${err}`);
  });

  // res.send('NOT IMPLEMENTED: ImageDataCell detail');
};

// Display book create form on GET
exports.imagedatacell_create_get = function (req, res) {
  res.send('NOT IMPLEMENTED: ImageDataCell create GET');
};

// Handle book create on POST
exports.imagedatacell_create_post = function (req, res) {
  req.checkBody('x_axis', 'x_axis required').notEmpty();
  req.checkBody('y_axis', 'y_axis required').notEmpty();
  req.checkBody('data', 'data required').notEmpty();

  req.sanitize('x_axis').escape();
  req.sanitize('x_axis').trim();
  req.sanitize('y_axis').escape();
  req.sanitize('y_axis').trim();
  // req.sanitize('data').escape();
  // req.sanitize('data').trim();

  const errors = req.validationErrors();

  // debug('here!1');
  // debug(req.body.data);

  // debug('here!2');
  if (errors) {
    // need to render an error
    debug('errors in validation : ');
  } else {
    const freshDataCell = new ImageDataCell({
      x_axis: req.body.x_axis,
      y_axis: req.body.y_axis,
      owner: null,
      accessType: null,
      data: req.body.data,
    });

    ImageDataCell.findOneAndUpdate({
      x_axis: req.body.x_axis,
      y_axis: req.body.y_axis,
    }, { data: req.body.data }).exec().then((foundCell) => {
      if (foundCell === null) {
        freshDataCell.save(function (err) {
          if (err) { return next(err); }
          debug('fresh data cell saved!');
        }).then((saved) => {
          Timer.cellUpdateCheckArray.push({x_axis: req.body.x_axis, y_axis: req.body.y_axis});
          res.json(saved);
        }, (err) => {
          console.log('save err :' + err);
          res.send('rejected : ' + err);
        });
      } else {
        Timer.cellUpdateCheckArray.push({x_axis: req.body.x_axis, y_axis: req.body.y_axis});
        res.json(foundCell);
      }
    }, (err) => {
      console.log('findOne err :' + err);
      res.send('rejected : ' + err);
    });
    /* .exec(function (err, foundCell) {
      console.log('found_genre: ' + foundCell);
      if (err) { return next(err); }
      if (foundCell) {
        console.log('found cell');
        freshDataCell.save(function (err, foundCell) {
          if (err) { return next(err); }
          debug('fresh data cell saved!');
        }).then((value) => {
          res.json(value);
        }, (reason) => {
          res.send('rejected : ' + reason);
        });
      } else {
        freshDataCell.save(function (err) {
          if (err) { return next(err); }
          debug('fresh data cell saved!');
        }).then((value) => {
          res.json(value);
        }, (reason) => {
          res.send('rejected : ' + reason);
        });
      }
    });*/
  }
  // res.send('NOT IMPLEMENTED: ImageDataCell create POST');
};

// Display book delete form on GET
exports.imagedatacell_delete_get = function (req, res) {
  res.send('NOT IMPLEMENTED: ImageDataCell delete GET');
};

// Handle book delete on POST
exports.imagedatacell_delete_post = function (req, res) {
  res.send('NOT IMPLEMENTED: ImageDataCell delete POST');
};

// Display book update form on GET
exports.imagedatacell_update_get = function (req, res) {
  res.send('NOT IMPLEMENTED: ImageDataCell update GET');
};

// Handle book update on POST
exports.imagedatacell_update_post = function (req, res) {
  res.send('NOT IMPLEMENTED: ImageDataCell update POST');
};

exports.imagedatacell_find_by_coordinates = (req, res) => {
  ImageDataCell.findOne({
    x_axis: req.params.xAxis,
    y_axis: req.params.yAxis,
  }).exec().then((cell) => {
    // if nothing exists a cell with null data returns.
    if (cell == null) {
      const emptycell = {
        x_axis: req.params.xAxis,
        y_axis: req.params.yAxis,
        data: null,
      };
      res.json(emptycell);
    } else {
      res.json(cell);
    }
  }, (err) => {
    // need better error handling
    debug(err);
    res.send(`error with finding ${err}`);
  });
};

exports.cell_image_load_by_coordinates = (req, res) => {
  try{
    debug('data/image' + req.params.xAxis + 'c' + req.params.yAxis);
    fs.readFile(__dirname + '/../data/1sc1f' + req.params.xAxis + 'c' + req.params.yAxis , function(err, data){
      debug('/../data/1sc1f' + req.params.xAxis + 'c' + req.params.yAxis);
      let cell = {
        x_axis: req.params.xAxis,
        y_axis: req.params.yAxis,
        data: null,
        };
      debug(data);
      if(data){ 
        cell.data = data;
      };
      debug(cell);     
      res.json(cell);
    });
  }catch(err){
    debug(err);
    res.send('not data find');
  }
}