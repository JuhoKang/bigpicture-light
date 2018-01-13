const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const FlagSchema = new Schema({
  flag1: Number,
  flag2: Number,
});

module.exports = mongoose.model('Flag', FlagSchema);
