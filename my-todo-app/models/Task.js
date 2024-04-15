const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // Making title a required field
  },
  description: {
    type: String,
    required: false,
  },
  reluctanceScore: {
    type: Number,
    default: 1, // Default reluctance score if not specified
  },
  completed: {
    type: Boolean,
    default: false, // By default, tasks are not completed
  },
  completed_at: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the task creation time
  },
  note: {
    type: String,
    default: '', // Optional note, e.g., "Created from task - [Original Task Title]"
  },
  brokenDown: {
    type: Boolean, 
    default: false
  },
  masterTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: false
  },
});

// Compiling the schema into a model
const Task = mongoose.model('Task', taskSchema);

// Exporting the model
module.exports = Task;
