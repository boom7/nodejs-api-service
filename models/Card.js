const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  changeDescription: { type: String, required: true },
}, { timestamps: true }); 

const suggestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true }); 

const cardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["To Do", "In Progress", "Done"],
    default: "To Do", 
  },
  suggestions: [suggestionSchema],
  histories: [historySchema],
}, { timestamps: true }); 

module.exports = mongoose.model("Card", cardSchema);
