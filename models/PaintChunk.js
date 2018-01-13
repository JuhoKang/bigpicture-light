const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PaintChunkSchema = new Schema({
  x_axis: Number,
  y_axis: Number,
  owner: Schema.Types.ObjectId,
  accesType: String,
  data: String,
}, { timestamps: true });

PaintChunkSchema
.virtual('url')
.get(function () {
  return `/api/paintchunk/${this._id}`;
// timestamps add createdAt and updatedAt
});

module.exports = mongoose.model('PaintChunk', PaintChunkSchema);
