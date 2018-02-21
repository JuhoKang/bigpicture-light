const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PaintPngSchema = new Schema({
  x_axis: Number,
  y_axis: Number,
  size: Number,
  base64: String,
}, { timestamps: true });

PaintPngSchema
.virtual("url")
.get(function () {
  return `/api/paintpng/${this._id}`;
// timestamps add createdAt and updatedAt
});

module.exports = mongoose.model("PaintPng", PaintPngSchema);
