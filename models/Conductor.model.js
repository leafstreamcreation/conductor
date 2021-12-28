const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const conductorSchema = new Schema({
  text: { type: String, required: true },
});

const Conductor = model("Conductor", conductorSchema);

module.exports = Conductor;
