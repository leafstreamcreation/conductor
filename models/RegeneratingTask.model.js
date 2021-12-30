const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const regenTaskSchema = new Schema({
  text: { type: String, required: true },
  regenInterval: { type: Number, required: true },
  scheduleDate: { type: Date, required: true },
}, {
  timestamps: true,
});

const RegeneratingTask = model("RegeneratingTask", regenTaskSchema);

module.exports = RegeneratingTask;
