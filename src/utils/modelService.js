const axios = require('axios');
const logger = require('./logger');
const Blog = require('../models/blog.model');

const OLLAMA_HOST = 'http://127.0.0.1:11434';
const GEMMA_MODEL = 'gemma3:1b';
const EMBED_MODEL = 'nomic-embed-text';

// Run prompt through Gemma model
async function runOllamaModel(prompt) {
  try {
    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: GEMMA_MODEL,
      prompt,
      stream: false
    });

    return response.data.response.trim();
  } catch (err) {
    logger.error(`Ollama generate error: ${err.message}`);
    throw err;
  }
}

// Run embedding model on input text
async function runOllamaEmbed(text) {
  try {
    const response = await axios.post(`${OLLAMA_HOST}/api/embed`, {
      model: EMBED_MODEL,
      input: text
    });
    const data = response.data.embeddings;
    return data;
  } catch (err) {
    logger.error(`Ollama embed error: ${err.message}`);
    throw err;
  }
}

// Generate a blog topic
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

// Generate blog content
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

// Get existing blog titles
async function getAllBlogTitles() {
  const blogs = await Blog.find({}, { title: 1, _id: 0 });
  return blogs.map(b => b.title.toLowerCase().trim());
}

module.exports = {
  generateTopicWithModel,
  generateContentWithModel,
  getAllBlogTitles,
  runOllamaModel,
  runOllamaEmbed
};
