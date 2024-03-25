require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const OpenAIApi = require('openai');
const app = express();
const port = 3000;

// Model import
const Task = require('./models/Task'); // Ensure this path matches your project structure
const { breakdownPrompt, inputPrompt } = require('./prompts');

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

app.get('/tasks/active', async (req, res) => {
  try {
    const tasks = await Task.find({ completed_at: null });
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
      return res.status(404).send({ message: "Task not found." });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: breakdownPrompt(task.title, task.description) }],
    }).catch(err => {
      console.error("OpenAI API error:", err);
      res.status(500).send({ message: "Failed to generate subtasks due to an OpenAI API error." });
      return; // Ensure no further execution
    });
    console.log(response.choices[0].message.content)
    const subtasks = parseOpenAIResponse(response);
    // Send a successful response only if the above operations complete without entering the catch block
    res.status(200).send({ message: subtasks });
  } catch (error) {
    console.error(error);
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

//very similar to method above. Please refactor/combine!
app.post('/tasks/saveTasks', async (req, res) => {
  console.log("HERE WITH tasks!!!")

  const { tasks } = req.body;
  try {
    // Create and save each task as a new task
    const savedTasks = await Promise.all(tasks.map(async (task) => {
      const newTask = new Task({
        ...task,
        completed: false,
        brokenDown: false,
      });
      return await newTask.save();
    }));

    res.status(201).send(savedTasks);
  } catch (error) {
    console.error('Failed to save tasks:', error);
    res.status(500).send({ message: 'Failed to save tasks.' });
  }
});

app.get('/tasks/subtasks/:taskId', async (req, res) => {
  try {
    const masterTaskId = req.params.taskId;
    const subtasks = await Task.find({ masterTaskId: masterTaskId });
    // 0 is fine!

    // if (subtasks.length === 0) {
    //   return res.status(404).send({ message: 'No subtasks found for this task.' });
    // }

    res.status(200).json(subtasks);
  } catch (error) {
    console.error('Failed to get subtasks:', error);
    res.status(500).send({ message: 'Error fetching subtasks' });
  }
});

app.post('/voice/tasks', async (req, res) => {
  const { text } = req.body; // Transcribed text from voice input
  console.log("Got some good stuff: ", text)

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: inputPrompt(text) }],
    }).catch(err => {
      console.error("OpenAI API error:", err);
      // Properly exit the function after sending a response on error
      res.status(500).send({ message: "Failed to generate tasks due to an OpenAI API error." });
      return; // Ensure no further execution
    });
    console.log("Extracting tasks from voice input: ", response.choices[0].message.content)
    const tasks = parseOpenAIResponse(response);

    res.status(200).send({ message: tasks });
  } catch (error) {
    console.error(error);
    // A catch-all error handler should be the last resort for sending error responses
    res.status(500).send({ message: error.message || "An error occurred." });
  }
});

function parseOpenAIResponse(responseJson) {
  const content = responseJson.choices[0].message.content;

  // Splitting the content by new lines to get each subtask
  const lines = content.trim().split('\n');

  // Mapping each line to a subtask object
  const subtasks = lines.map(line => {
    // Directly returning the title with a default reluctance score of 1
    return { title: line, reluctanceScore: 1 };
  }).filter(subtask => subtask.title.trim() !== ''); // Ensuring no empty titles

  return subtasks;
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
