const { spawn } = require('child_process');
const logger = require('./logger');
const Blog = require('../models/blog.model');

// Reusable function to run any prompt with the Gemma model
function runOllamaModel(prompt) {
  return new Promise((resolve, reject) => {
    const model = spawn('ollama', ['run', 'gemma3:1b']);

    let output = '';
    let errorOutput = '';

    model.stdout.on('data', (data) => output += data.toString());
    model.stderr.on('data', (data) => errorOutput += data.toString());

    model.on('close', (code) => {
      if (code !== 0) {
        logger.error(`Ollama model failed with code ${code}: ${errorOutput}`);
        return reject(new Error(errorOutput.trim()));
      }
      resolve(output.trim());
    });

    model.stdin.write(prompt + '\n');
    model.stdin.end();
  });
}

// Generate a blog topic based on categories and subcategories
async function generateTopicWithModel({ prompt, categories = [], subcategories = {} }) {
  try {
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    const subList = Array.isArray(subcategories[selectedCategory]) ? subcategories[selectedCategory] : [];
    const selectedSubcategory = subList[Math.floor(Math.random() * subList.length)];

    const finalPrompt = `${prompt}, Category: ${selectedCategory}, Subcategory: ${selectedSubcategory}`;
    const output = await runOllamaModel(finalPrompt);

    try {
      const jsonMatch = output.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) throw new Error('No JSON found in output');

      const json = JSON.parse(jsonMatch[0]);

      return {
        title: json.title,
        category: selectedCategory,
        subcategory: selectedSubcategory
      };
    } catch (e) {
      logger.warn('Failed to parse JSON. Trying to extract title line.');

      const lines = output.split('\n').map(line => line.trim()).filter(Boolean);
      const titleLine = lines.find(line => line.startsWith('**') && line.endsWith('**'));
      const cleanedTitle = titleLine ? titleLine.replace(/\*\*/g, '') : '';

      return {
        title: cleanedTitle,
        category: selectedCategory,
        subcategory: selectedSubcategory
      };
    }
  } catch (err) {
    logger.error(`generateTopicWithModel error: ${err.message}`);
    throw err;
  }
}

// Generate a blog post from a title and category context
async function generateContentWithModel({ title, category, subcategory, minWords, maxWords, tone }) {
  try {
    const prompt = `
Generate a detailed blog post with the following details:
Title: "${title}"
Category: ${category}
Subcategory: ${subcategory}
Tone: ${tone}
Word count: between ${minWords} and ${maxWords} words.

Please include an engaging introduction, at least 3 informative sections, and a conclusion.
Return only the content (no metadata or explanation).
`.trim();

    logger.info('Generating content with Ollama model...', { title });
    const output = await runOllamaModel(prompt);

    logger.info(`Generated content length: ${output.length} characters`);
    return { content: output };
  } catch (err) {
    logger.error(`generateContentWithModel error: ${err.message}`);
    throw err;
  }
}

// Fetch and normalize all existing blog titles
async function getAllBlogTitles() {
  const blogs = await Blog.find({}, { title: 1, _id: 0 });
  return blogs.map(b => b.title.toLowerCase().trim());
}

// Optional export if direct Gemma use is needed elsewhere
module.exports = {
  generateTopicWithModel,
  generateContentWithModel,
  getAllBlogTitles,
  runOllamaModel
};
