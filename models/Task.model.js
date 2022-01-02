const { Schema } = require("mongoose");

const taskSchema = new Schema({
  text: { type: String, required: true, unique: true },
  updates: { type: [Date] },
});

module.exports = taskSchema;