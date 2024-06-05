require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const User = require('./models/User');
const Task = require('./models/Task');
const { breakdownPrompt, inputPrompt, dailyInsightPrompt } = require('./prompts');
const OpenAIApi = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

// OPENAPI Config
const openai = new OpenAIApi({
  api_key: process.env.OPENAI_API_KEY,
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

mongoose.set('debug', true);

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  console.log(req.body);

  const { email, password, securityQuestion, securityAnswer } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      email,
      password,
      securityQuestion,
      securityAnswer,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.securityAnswer = await bcrypt.hash(securityAnswer, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      'your_jwt_secret',
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      'your_jwt_secret',
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Request Password Reset
app.post('/api/password/request-reset', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    res.json({ securityQuestion: user.securityQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Verify Security Answer
app.post('/api/password/verify-answer', async (req, res) => {
  const { email, securityAnswer } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    const isMatch = await bcrypt.compare(securityAnswer, user.securityAnswer);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect security answer' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Reset Password
app.post('/api/password/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ msg: 'Password has been reset' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// Task routes
app.post('/tasks', auth, async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      user: req.user.id,
    });
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get('/tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    res.status(200).send(tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/tasks/active', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id, completed_at: null, masterTaskId: null });
    res.status(200).send(tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/tasks/completed', auth, async (req, res) => {
  try {
    const completedTasks = await Task.find({ user: req.user.id, completed_at: { $ne: null } });
    res.json(completedTasks);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch completed tasks." });
  }
});

app.get('/tasks/random', auth, async (req, res) => {
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
    const tasks = await Task.find({ user: req.user.id, reluctanceScore: scoreRange, completed_at: null }).exec();
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

app.get('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.patch('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true, runValidators: true });
    if (!task) {
      return res.status(404).send();
    }
    res.status(200).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.delete('/tasks/:id', auth, async (req, res) => {
  try {
    console.log("Deleting task and its subtasks: ", req.params.id);

    // Calling the recursive delete function
    await deleteTaskAndSubtasks(req.params.id, req.user.id);

    res.status(200).send({ message: "Task and all its subtasks were deleted successfully." });
  } catch (error) {
    console.error("Failed to delete task:", error);
    res.status(500).send(error);
  }
});

app.post('/tasks/:id/breakdown', auth, async (req, res) => {
  try {
    console.log(req.params.id)
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
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

app.post('/tasks/:id/saveSubtasks', auth, async (req, res) => {
  const { id } = req.params;
  const { subtasks } = req.body;

  try {
    // Optional: Find and mark the original task as 'broken down'
    const originalTask = await Task.findOne({ _id: id, user: req.user.id });
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
        brokenDown: false,
        masterTaskId: id,
        note: `Created from this big task: ${originalTask.title}`,
        user: req.user.id,
      });
      return await newTask.save();
    }));

    res.status(201).send(savedSubtasks);
  } catch (error) {
    console.error('Failed to save subtasks:', error);
    res.status(500).send({ message: 'Failed to save subtasks.' });
  }
});

app.post('/tasks/saveTasks', auth, async (req, res) => {
  const { tasks } = req.body;
  try {
    // Create and save each task as a new task
    const savedTasks = await Promise.all(tasks.map(async (task) => {
      const newTask = new Task({
        ...task,
        brokenDown: false,
        user: req.user.id,
      });
      return await newTask.save();
    }));

    res.status(201).send(savedTasks);
  } catch (error) {
    console.error('Failed to save tasks:', error);
    res.status(500).send({ message: 'Failed to save tasks.' });
  }
});

app.get('/tasks/subtasks/:taskId', auth, async (req, res) => {
  try {
    const masterTaskId = req.params.taskId;
    const subtasks = await Task.find({ masterTaskId: masterTaskId, user: req.user.id }).sort({ title: 1 });

    res.status(200).json(subtasks);
  } catch (error) {
    console.error('Failed to get subtasks:', error);
    res.status(500).send({ message: 'Error fetching subtasks' });
  }
});

app.post('/voice/tasks', auth, async (req, res) => {
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

app.get('/dailyInsight', auth, async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  console.log(startOfDay, endOfDay);
  const tasks = await Task.find({
    user: req.user.id,
    completed_at: { $gte: startOfDay, $lte: endOfDay },
  }).select('title description reluctanceScore completed_at createdAt');

  if (tasks.length === 0) {
    return res.status(200).send({ message: "You may not have completed any tasks today, but tomorrow is a new opportunity to shine! Rest well and prepare to tackle your goals!" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: dailyInsightPrompt(tasks) }],
      max_tokens: 150,
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

app.get('/completedTasks', auth, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayStart.getDate() + 1);

    const completedTasks = await Task.find({
      user: req.user.id,
      completed_at: { $gte: todayStart, $lt: todayEnd }
    }).sort({ completed_at: 1 });

    res.status(200).json({ tasks: completedTasks });
  } catch (error) {
    console.error('Error fetching completed tasks:', error);
    res.status(500).json({ error: 'Error fetching completed tasks' });
  }
});

app.get('/createdTasks', auth, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayStart.getDate() + 1);

    const createdTasks = await Task.find({
      user: req.user.id,
      createdAt: { $gte: todayStart, $lt: todayEnd }
    }).sort({ createdAt: 1 });

    res.status(200).json({ tasks: createdTasks });
  } catch (error) {
    console.error('Error fetching created tasks:', error);
    res.status(500).json({ error: 'Error fetching created tasks' });
  }
});

// a one-time endpoint to assign all tasks to a single user
// app.put('/update-tasks-user', async (req, res) => {
//   const { userId } = req.body;

//   if (!userId) {
//     return res.status(400).json({ msg: 'User ID is required' });
//   }

//   try {
//     const result = await Task.updateMany({}, { $set: { user: userId } });
//     res.json({ msg: 'Tasks updated successfully', result });
//   } catch (err) {
//     console.error('Error updating tasks:', err);
//     res.status(500).json({ msg: 'Server error' });
//   }
// });

const deleteTaskAndSubtasks = async (taskId, userId) => {
  // Find all subtasks of the current task
  const subtasks = await Task.find({ masterTaskId: taskId, user: userId });

  // Recursively delete each subtask
  for (const subtask of subtasks) {
    await deleteTaskAndSubtasks(subtask._id, userId);
  }

  // After all subtasks have been handled, delete the current task
  await Task.findOneAndDelete({ _id: taskId, user: userId });
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
