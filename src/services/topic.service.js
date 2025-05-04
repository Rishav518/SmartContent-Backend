const { generateTopicWithModel } = require('../utils/modelService');
const logger = require('../utils/logger');
const config = require('../config');
const validator = require('./validator.service');
const { default: axios } = require('axios');

/**
 * Service for generating blog topics
 */
class TopicService {
  /**
   * Generate a new blog topic
   * @param {Object} options - Options for topic generation
   * @returns {Promise<Object>} - The generated topic
   */
  async generateTopic(options = {}) {
    try {
      logger.info('Generating new blog topic');
      
      const categories = options.categories || config.defaultCategories;
      const subcategories = options.subcategories || config.defaultSubcategories;
      
      const topicData = await generateTopicWithModel({
        categories,
        subcategories,
        prompt: this.buildTopicPrompt(options)
      });
      
      const isUnique = await validator.isTopicUnique(topicData.title);
      logger.info(`Topic uniqueness check: ${isUnique}`);
      if (!isUnique) {
        logger.info(`Topic "${topicData.title}" already exists, generating alternative`);
        // Try again with a different prompt
        return this.generateTopic({
          ...options,
          retry: (options.retry || 0) + 1,
          avoidDuplicate: topicData.title
        });
      }
      
      logger.info(`Generated unique topic: "${topicData.title}"`);
      return {
        title: topicData.title,
        category: topicData.category,
        subcategory: topicData.subcategory
      };
      ;
    } catch (error) {
      logger.error(`Error generating topic: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Build the prompt for topic generation
   * @param {Object} options - Options for prompt building
   * @returns {string} - The generated prompt
   */
  buildTopicPrompt(options = {}) {
    let prompt = "Generate a single unique, engaging blog post topic with a title, category, and subcategory. Dont' include any other text. The title should be catchy and relevant to the category and subcategory.";
    
    if (options.category) {
      prompt += ` The category should be ${options.category}.`;
    }
    
    if (options.subcategory) {
      prompt += ` The subcategory should be ${options.subcategory}.`;
    }
    
    if (options.keywords && options.keywords.length > 0) {
      prompt += ` Include some of these keywords if possible: ${options.keywords.join(', ')}.`;
    }
    
    if (options.avoidDuplicate) {
      prompt += ` Avoid anything similar to "${options.avoidDuplicate}".`;
    }
    
    if (options.retry && options.retry > 2) {
      prompt += " Be more creative and think outside the box.";
    }
    
    return prompt;
  }
}

module.exports = new TopicService();