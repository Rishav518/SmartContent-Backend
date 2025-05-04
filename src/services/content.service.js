const logger = require('../utils/logger');
const validator = require('./validator.service');
const { generateContentWithModel } = require('../utils/modelService');


/**
 * Service for generating blog content
 */
class ContentService {
  /**
   * Generate blog content based on a title
   * @param {Object} options - Content generation options
   * @returns {Promise<Object>} - The generated content
   */
  async generateContent(options = {}) {
    try {
      const { title, category, subcategory } = options;
      
      if (!title) {
        throw new Error('Title is required for content generation');
      }
      
      logger.info(`Generating content for topic: "${title}"`);
      
      // Generate content using DEEPSEEK AI
      const contentData = await generateContentWithModel({
        title,
        category,
        subcategory,
        minWords: options.minWords,
        maxWords: options.maxWords,
        tone: options.tone
      });

      
      // Check if content is similar to existing content
      const similarityCheck = await validator.checkContentSimilarity(contentData.content);
      
      if (similarityCheck.isSimilar) {
        logger.info(`Generated content is too similar to existing content (${similarityCheck.similarityScore}), regenerating`);
        
        // Try again with different parameters if too similar
        if ((options.retry || 0) < 3) {
          return this.generateContent({
            ...options,
            retry: (options.retry || 0) + 1,
            avoidSimilarTo: similarityCheck.similarPostId
          });
        } else {
          logger.warn(`Failed to generate unique content after ${options.retry} attempts`);
          contentData.similarityWarning = true;
          contentData.similarityScore = similarityCheck.similarityScore;
          contentData.similarPostId = similarityCheck.similarPostId;
        }
      }
      
      logger.info(`Successfully generated content for "${title}" (${contentData.content.length} chars)`);
      return contentData;
    } catch (error) {
      logger.error(`Error generating content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Format the generated content for storage
   * @param {Object} contentData - Raw content data
   * @returns {Object} - Formatted content
   */
  formatContent(contentData) {
    // Clean up any formatting issues
    let formattedContent = contentData.content;
    
    // Ensure proper paragraph breaks
    formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
    
    // Remove any special characters that might be artifacts from AI generation
    formattedContent = formattedContent.replace(/```[a-z]*\n|```/g, '');
    
    return {
      ...contentData,
      content: formattedContent
    };
  }
}

module.exports = new ContentService();