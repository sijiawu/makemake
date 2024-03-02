const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // Making title a required field
  },
  description: {
    type: String,
    required: true, // Making description a required field
  },
  reluctanceScore: {
    type: Number,
    default: 1, // Default reluctance score if not specified
  },
  completed: {
    type: Boolean,
    default: false, // By default, tasks are not completed
  },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the task creation time
  },
  note: {
    type: String,
    default: '', // Optional note, e.g., "Created from task - [Original Task Title]"
  }
});

// Compiling the schema into a model
const Task = mongoose.model('Task', taskSchema);

// Exporting the model
module.exports = Task;
