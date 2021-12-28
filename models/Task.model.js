const mongoose = require("mongoose");
const { Schema, model } = require("mongoose");

const taskSchema = new Schema({
  text: { type: String, srequired: true },
});

const Task = model("Task", taskSchema);

module.exports = Task;
