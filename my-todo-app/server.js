require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const OpenAIApi = require('openai');
const app = express();
const port = process.env.PORT || 3000;

// Model import
const Task = require('./models/Task'); // Ensure this path matches your project structure
const { breakdownPrompt, inputPrompt, dailyInsightPrompt } = require('./prompts');

app.use(express.json()); // Middleware to parse JSON bodies

// OPENAPI Config
const openai = new OpenAIApi({
  api_key: process.env.OPENAI_API_KEY,
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

mongoose.set('debug', true);

// Routes
// Create a new task
app.get('/', (req, res) => {
  res.send('Connected');
});

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

// non-completed and master tasks only, for AllTasksScreen
app.get('/tasks/active', async (req, res) => {
  try {
    const tasks = await Task.find({ completed_at: null, masterTaskId: null });
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

app.get('/tasks/random', async (req, res) => {
  console.log("HERE: ", req.query)
  const energyLevel = req.query.energyLevel;
  let scoreRange;
  switch (energyLevel) {
    case 'low':
      scoreRange = { $lte: 2 }; // Low energy: score 1 or 2
      break;
    case 'medium':
      scoreRange = { $gte: 3, $lte: 4 }; // Medium energy: score 3 or 4
      break;
    case 'high':
      scoreRange = { $eq: 5 }; // High energy: score 5
      break;
    default:
      return res.status(400).send({ message: "Invalid energy level." });
  }

  try {
    const tasks = await Task.find({ reluctanceScore: scoreRange, completed: false }).exec();
    if (tasks.length > 0) {
      // Randomly select a task
      const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
      res.send(randomTask);
    } else {
      res.send(null);
    }
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    res.status(500).send({ message: "An error occurred while fetching tasks." });
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
    console.log("Deleting task and its subtasks: ", req.params.id);

    // Calling the recursive delete function
    await deleteTaskAndSubtasks(req.params.id);

    res.status(200).send({ message: "Task and all its subtasks were deleted successfully." });
  } catch (error) {
    console.error("Failed to delete task:", error);
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
    const subtasks = await Task.find({ masterTaskId: masterTaskId }).sort({ title: 1 });
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

app.get('/dailyInsight', async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    completed_at: { $gte: startOfDay, $lte: endOfDay },
    completed: true
  }).select('title description reluctanceScore completed_at createdAt');

  if (tasks.length === 0) {
    return res.status(200).send({ message: "You may not have completed any tasks today, but tomorrow is a new opportunity to shine! Rest well and prepare to tackle your goals!" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: dailyInsightPrompt(tasks) }],
    }).catch(err => {
      console.error("OpenAI API error:", err);
      // Properly exit the function after sending a response on error
      res.status(500).send({ message: "Failed to generate tasks due to an OpenAI API error." });
      return; // Ensure no further execution
    });

    console.log("OpenAI API response:", response.choices[0].message.content);  // Log the whole response
    return res.status(200).send({ message: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    // A catch-all error handler should be the last resort for sending error responses
    res.status(500).send({ message: error.message || "An error occurred." });
  }
});


const deleteTaskAndSubtasks = async (taskId) => {
  // Find all subtasks of the current task
  const subtasks = await Task.find({ masterTaskId: taskId });

  // Recursively delete each subtask
  for (const subtask of subtasks) {
    await deleteTaskAndSubtasks(subtask._id);
  }

  // After all subtasks have been handled, delete the current task
  await Task.findByIdAndDelete(taskId);
}


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
