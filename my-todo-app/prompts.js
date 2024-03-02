// prompts.js

const breakdownPrompt = (title, description) => `
  Given the task titled "${title}" with the description "${description}", break it down into no more than 5 smaller, actionable subtasks that can be easily followed. Each subtask should include an estimated reluctance score from 1 to 5, with 5 being the hardest. Format the response as follows: subtask title - reluctance score.
`;

// Export the prompts
module.exports = {
    breakdownPrompt,
};
