require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const OpenAIApi = require('openai');
const app = express();
const port = 3000;

// Model import
const Task = require('./models/Task'); // Ensure this path matches your project structure

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
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).send({ message: "Task not found." });
    }
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Adjust according to the latest available model
      messages: [{ role: 'user', content: `Given the task titled "${task.title}" with the description "${task.description}", generate a detailed list of subtasks required to complete it. Each subtask should include an estimated reluctance score from 1 to 5, with 5 being the hardest. Format the response as follows: subtask title - reluctance score.` }],
    }).catch(err => {
      console.error("OpenAI API error:", err);
      throw new Error("Failed to generate subtasks due to an OpenAI API error.");
    });

    // Proceed with parsing the response and other logic...
    const subtasks = parseOpenAIResponse(response);
    res.status(200).send({ message: subtasks });

    if (subtasks.length === 0) {
      return res.status(400).send({ message: "No valid subtasks generated." });
    }

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message || "An error occurred." });
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
