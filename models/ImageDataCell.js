const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ImageDataCellSchema = new Schema({
  x_axis: Number,
  y_axis: Number,
  owner: Schema.Types.ObjectId,
  accesType: String,
  data: String,
  syncNum: Number,
});

ImageDataCellSchema
.virtual('url')
.get(function () {
  return '/api/imagedatacell/' + this._id;
});

module.exports = mongoose.model('ImageDataCell', ImageDataCellSchema);
