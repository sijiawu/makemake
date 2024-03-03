require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const OpenAIApi = require('openai');
const app = express();
const port = 3000;

// Model import
const Task = require('./models/Task'); // Ensure this path matches your project structure
const { breakdownPrompt } = require('./prompts');

app.use(express.json()); // Middleware to parse JSON bodies

// OPENAPI Config
const openai = new OpenAIApi({
  api_key: process.env.OPENAI_API_KEY,
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Routes
// Create a new task
app.post('/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.status(200).send(tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Putting it all the way up here to get it matched first
app.get('/tasks/completed', async (req, res) => {
  try {
    const completedTasks = await Task.find({ completed_at: { $ne: null } });
    console.log(completedTasks)
    res.json(completedTasks);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch completed tasks." });
  }
});

// Get a single task by id
app.get('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a task
app.patch('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.post('/tasks/:id/breakdown', async (req, res) => {
  try {
    console.log(req.params.id)
    const task = await Task.findById(req.params.id);
    if (!task) {
      // If the task is not found, send a 404 response and exit the function
      return res.status(404).send({ message: "Task not found." });
    }

    // Assuming this is an async operation that might fail
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: breakdownPrompt(task.title, task.description) }],
    }).catch(err => {
      console.error("OpenAI API error:", err);
      // Properly exit the function after sending a response on error
      res.status(500).send({ message: "Failed to generate subtasks due to an OpenAI API error." });
      return; // Ensure no further execution
    });
    console.log(response)
    // Proceed with logic assuming success...
    // Make sure this part does not execute if the catch block above sends a response
    const subtasks = parseOpenAIResponse(response);
    // Send a successful response only if the above operations complete without entering the catch block
    res.status(200).send({ message: subtasks });
  } catch (error) {
    console.error(error);
    // A catch-all error handler should be the last resort for sending error responses
    res.status(500).send({ message: error.message || "An error occurred." });
  }
});

app.post('/tasks/:id/saveSubtasks', async (req, res) => {
  const { id } = req.params;
  const { subtasks } = req.body;

  try {
    // Optional: Find and mark the original task as 'broken down'
    const originalTask = await Task.findById(id);
    if (!originalTask) {
      return res.status(404).send({ message: 'Original task not found.' });
    }
    originalTask.brokenDown = true;
    await originalTask.save();

    // Create and save each subtask as a new task
    const savedSubtasks = await Promise.all(subtasks.map(async (subtask) => {
      const newTask = new Task({
        ...subtask,
        // Set additional properties as needed, e.g., marking them as not completed
        completed: false,
        brokenDown: false,
        masterTaskId: id,
        note: `Created from this big task: ${originalTask.title}`,
      });
      return await newTask.save();
    }));

    res.status(201).send(savedSubtasks);
  } catch (error) {
    console.error('Failed to save subtasks:', error);
    res.status(500).send({ message: 'Failed to save subtasks.' });
  }
});

app.get('/tasks/subtasks/:taskId', async (req, res) => {
  try {
    const masterTaskId = req.params.taskId;
    const subtasks = await Task.find({ masterTaskId: masterTaskId });

    if (subtasks.length === 0) {
      return res.status(404).send({ message: 'No subtasks found for this task.' });
    }

    res.status(200).json(subtasks);
  } catch (error) {
    console.error('Failed to get subtasks:', error);
    res.status(500).send({ message: 'Error fetching subtasks' });
  }
});

function parseOpenAIResponse(responseJson) {
  // Extracting the content field from the response
  const content = responseJson.choices[0].message.content;

  // Splitting the content into lines, each representing a subtask
  const lines = content.trim().split('\n');

  // Parsing each line to extract the subtask title and reluctance score
  const subtasks = lines.map(line => {
    // Using a regular expression to extract the title and score
    const match = line.match(/^(.*?) - (\d+)$/);

    if (match) {
      const [, title, scoreStr] = match;
      const score = parseInt(scoreStr, 10); // Converting score to an integer
      return { title, reluctanceScore: score };
    }

    // Returning null for lines that don't match the expected format
    // These will be filtered out in the next step
    return null;
  }).filter(subtask => subtask !== null); // Removing any null entries

  return subtasks;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
