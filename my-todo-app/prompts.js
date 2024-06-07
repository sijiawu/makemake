// prompts.js

const breakdownPrompt = (title, description) => `
  Given the task titled "${title}" with the description "${description}", break it down into no more than 5 smaller, actionable subtasks that can be easily followed. The fewer the better.
`;

const inputPrompt = (voiceInput) => `
  Given the voice input "${voiceInput}", extract tasks mentioned in the input, do not infer additional tasks.
`;

const dailyInsightPrompt = (tasks) => `
  Reflect on today's accomplishments: ${tasks.map(t => {
    const taskDuration = new Date(t.completed_at) - new Date(t.createdAt);
    const hours = Math.floor(taskDuration / 3600000);
    const minutes = Math.floor((taskDuration % 3600000) / 60000);
    return `${t.title} - ${t.description}, which took ${hours} hours and ${minutes} minutes to complete, and had a reluctance score of ${t.reluctanceScore}.`;
  }).join(' ')} Provide encouragement and insight based on these tasks.
`;

const resistanceAnalysisPrompt = (tasks) => `
  Based on these tasks: ${tasks.map(t => {
    const taskInfo = `${t.title}${t.description ? ` - ${t.description}` : ''}${t.note ? ` (Note: ${t.note})` : ''}`;
    return taskInfo;
  }).join(' ')}

  Summarize the common aspects among these tasks, such as themes, types of activities, or skills involved. Provide insight into why these common aspects might be significant or difficult for the user. 

  Based on these insights, offer suggestions for how the user can approach similar tasks in the future more effectively. These suggestions should be practical and tailored to the user's potential strengths and areas for improvement. 
`;

// Export the prompts
module.exports = {
    breakdownPrompt,
    inputPrompt,
    dailyInsightPrompt,
    resistanceAnalysisPrompt
};

