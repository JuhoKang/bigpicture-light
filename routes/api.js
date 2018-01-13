const express = require('express');

const router = express.Router();

const imageDataCellController = require('../controllers/imageDataCellController');
const paintChunkController = require('../controllers/paintChunkController');

router.get('/', function(req, res, next) {
  res.send('NOT IMPLEMENTED: api index');
});
router.get('/paintchunk/json/coord/:xAxis/:yAxis', paintChunkController.paintchunk_json_find_by_coordinates);

/* GET request for creating a ImageDataCell. NOTE This must come before routes that display ImageDataCell (uses id) */
router.get('/imagedatacell/create', imageDataCellController.imagedatacell_create_get);

/* POST request for creating ImageDataCell. */
router.post('/imagedatacell/create', imageDataCellController.imagedatacell_create_post);

/* GET request to delete ImageDataCell. */
router.get('/imagedatacell/:id/delete', imageDataCellController.imagedatacell_delete_get);

// POST request to delete ImageDataCell
router.post('/imagedatacell/:id/delete', imageDataCellController.imagedatacell_delete_post);

/* GET request to update ImageDataCell. */
router.get('/imagedatacell/:id/update', imageDataCellController.imagedatacell_update_get);

// POST request to update ImageDataCell
router.post('/imagedatacell/:id/update', imageDataCellController.imagedatacell_update_post);

/* GET request for one ImageDataCell. */
router.get('/imagedatacell/:id', imageDataCellController.imagedatacell_detail);

/* GET request for list of all ImageDataCell items. */
router.get('/imagedatacells', imageDataCellController.imagedatacell_list);

/* GET request for ImageDataCell*/
router.get('/imagedatacell/coord/:xAxis/:yAxis', imageDataCellController.imagedatacell_find_by_coordinates);

/* GET request for cellImageLoad*/
router.get('/cellImageLoad/coord/:xAxis/:yAxis', imageDataCellController.cell_image_load_by_coordinates);

module.exports = router;
