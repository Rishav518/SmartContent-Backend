const logger = require('../utils/logger');
const topicService = require('../services/topic.service');
const contentService = require('../services/content.service');
const publisherService = require('../services/publisher.service');
const validatorService = require('../services/validator.service');
const config = require('../config');

/**
 * Job for generating and publishing blog posts
 */
class BlogJob {
  /**
   * Generate and publish a new blog post
   * @param {Object} options - Options for generation
   * @returns {Promise<Object>} - The generated and published blog post
   */
  async generateAndPublishPost(options = {}) {
    try {
      logger.info('Starting blog post generation job');
      
      // Step 1: Generate a unique topic
      logger.info('Generating topic...');
      const topicData = await topicService.generateTopic({
        category: options.category,
        subcategory: options.subcategory,
        keywords: options.keywords
      });
      
      if (!topicData || !topicData.title) {
        throw new Error('Failed to generate valid topic');
      }
      
      logger.info(`Generated topic: "${topicData.title}", ${topicData.category}, ${topicData.subcategory}`);
      logger.info("SUCCESSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS STEP 1")
      
      // Step 2: Generate content for the topic
      logger.info('Generating content...');
      const rawContentData = await contentService.generateContent({
        title: topicData.title,
        category: topicData.category,
        subcategory: topicData.subcategory,
        minWords: options.minWords || 600,
        maxWords: options.maxWords || 2000,
        tone: options.tone || 'informative',
      });
      
      // Format the content
      const contentData = contentService.formatContent(rawContentData);
      logger.info(`SUCCESSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS STEP 2`);
      
      // Step 3: Save the post to the database
      logger.info('Publishing post...');
      logger.info(`Post content: ${topicData.title}, ${topicData.category}, ${topicData.subcategory}`);
      //make slug from title
      const slug = validatorService.generateSlug(topicData.title);
      const savedPost = await publisherService.savePost({
        title: topicData.title,
        content: contentData.content,
        category: topicData.category,
        subcategory: topicData.subcategory,
        status: options.autoPublish ? 'published' : 'draft',
        slug: slug,
        similarityScore: contentData.similarityScore || 0
      });
      
      logger.info(`Successfully generated and saved blog post with ID: ${savedPost._id}`);
      
      return {
        success: true,
        post: savedPost,
        message: `Successfully generated post: "${topicData.title}"`
      };
    } catch (error) {
      logger.error(`Error in blog generation job: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Generate multiple blog posts in batch
   * @param {number} count - Number of posts to generate
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} - Array of results
   */
  async generateBatch(count = 3, options = {}) {
    const results = [];
    
    for (let i = 0; i < count; i++) {
      try {
        logger.info(`Generating batch post ${i+1}/${count}`);
        const result = await this.generateAndPublishPost(options);
        results.push(result);
        
        // Sleep between requests to avoid overwhelming the AI service
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        logger.error(`Error generating batch post ${i+1}: ${error.message}`);
        results.push({
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = new BlogJob();