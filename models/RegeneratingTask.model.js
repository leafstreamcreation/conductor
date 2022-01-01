const { Schema } = require("mongoose");

module.exports = new Schema({
  text: { type: String, required: true },
  regenInterval: { type: Number, required: true },
  scheduleDate: { type: Date, required: true },
}, {
  timestamps: true,
});
