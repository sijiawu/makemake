// prompts.js

const breakdownPrompt = (title, description) => `
  Given the task titled "${title}" with the description "${description}", break it down into no more than 5 smaller, actionable subtasks that can be easily followed. The fewer the better.
`;

const inputPrompt = (voiceInput) => `
  Given the voice input "${voiceInput}", extract tasks mentioned in the input, do not infer additional tasks.
`;

// Export the prompts
module.exports = {
    breakdownPrompt,
    inputPrompt
};
