const blogJob = require('../jobs/blogJob');
const { search } = require('../routes/blog.route');
const publisherService = require('../services/publisher.service');
const schedulerService = require('../services/scheduler.service');
const validatorService = require('../services/validator.service');
const logger = require('../utils/logger');

/**
 * Controller for blog-related endpoints
 */
class BlogController {
  
  async generatePost(req, res) {
    try {
      const options = {
        category: req.body.category,
        subcategory: req.body.subcategory,
        keywords: req.body.keywords,
        minWords: req.body.minWords,
        maxWords: req.body.maxWords,
        autoPublish: req.body.autoPublish || false
      };
      
      const result = await blogJob.generateAndPublishPost(options);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          post: result.post
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to generate blog post',
          error: result.error
        });
      }
    } catch (error) {
      logger.error(`Error in generatePost controller: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
  
  async generateBatch(req, res) {
    try {
      const count = parseInt(req.body.count) || 3;
      
      if (count > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum batch size is 10 posts'
        });
      }
      
      // Start the batch process (non-blocking)
      res.status(202).json({
        success: true,
        message: `Started generating ${count} blog posts in the background`,
        jobId: Date.now().toString()
      });
      
      // Execute batch job in background
      blogJob.generateBatch(count, {
        category: req.body.category,
        subcategory: req.body.subcategory,
        keywords: req.body.keywords,
        autoPublish: req.body.autoPublish || false
      }).catch(error => {
        logger.error(`Error in batch generation: ${error.message}`);
      });
    } catch (error) {
      logger.error(`Error in generateBatch controller: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
  
  async getPosts(req, res) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        category: req.query.category,
        subcategory: req.query.subcategory,
        search: req.query.search
      };
      const result = await publisherService.getPosts(options);

      res.status(200).json({
        success: true,
        posts: result.posts,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error(`Error in getPosts controller: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
  
  async getPostById(req, res) {
    try {
      const post = await publisherService.getPostById(req.params.id);
      
      res.status(200).json({
        success: true,
        post
      });
    } catch (error) {
      logger.error(`Error in getPostById controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
  
  async updatePostStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['draft', 'published', 'archived'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }
      
      const updatedPost = await publisherService.updatePostStatus(id, status);
      
      res.status(200).json({
        success: true,
        message: `Post status updated to ${status}`,
        post: updatedPost
      });
    } catch (error) {
      logger.error(`Error in updatePostStatus controller: ${error.message}`);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
  
  async runSchedulerNow(req, res) {
    try {
      res.status(202).json({
        success: true,
        message: 'Started blog generation job'
      });
      
      // Run job in background
      schedulerService.runJobNow('blogGeneration').catch(error => {
        logger.error(`Error running scheduled job: ${error.message}`);
      });
    } catch (error) {
      logger.error(`Error in runSchedulerNow controller: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  async generateSlug(req, res) {
    try {
      // fetch posts correctly
      const result = await publisherService.getPosts();
      console.log(result.length);
      const posts = result.posts; 
  
      if (!Array.isArray(posts)) {
        throw new Error('Invalid posts data structure');
      }
  
      const updatedPosts = await Promise.all(
        posts.map(async (post) => {
          const slug = validatorService.generateSlug(post.title);
          return await publisherService.updatePostSlug(post._id, slug);
        })
      );
  
      res.status(200).json({
        success: true,
        updatedPosts,
        numberOfPostsUpdated: updatedPosts.length,
        message: 'Slugs generated successfully ',
      });
    } catch (error) {
      logger.error(`Error in generateSlug controller: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  async getPostBySlug (req, res){
    try {
      const post = await publisherService.getPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found',
        });
      }
      res.status(200).json({
        success: true,
        post,
      });
    } catch (error) {
      logger.error(`Error in getPostBySlug controller: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  async getAllSlugs(req, res) {
    try {
      const posts = await publisherService.getPosts();
      if (!Array.isArray(posts.posts)) {
        throw new Error('Invalid posts data structure');
      }

      const slugs = posts.posts.map((post) => ({
        title: post.title,
        slug: post.slug,
      }));

      res.status(200).json({
        success: true,
        slugs,
        numberOfPosts: slugs.length,
        message: 'Slugs retrieved successfully',
      });
    } catch (error) {
      logger.error(`Error in getAllSlugs controller: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await publisherService.getCategories();
      //get subcategories for each category
      const subcategories = await Promise.all(
        categories.map(async (category) => {
          const subcategory = await publisherService.getSubcategories(category);
          return {
            category,
            subcategory,
          };
        })
      );
      res.status(200).json({
        success: true,
        subcategories,
        message: 'Categories retrieved successfully',
      });
    } catch (error) {
      logger.error(`Error in getCategories controller: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
  async getStats(req, res) {
    try {
      const stats = await publisherService.getStats();
      res.status(200).json({
        success: true,
        stats,
        message: 'Stats retrieved successfully',
      });
    } catch (error) {
      logger.error(`Error in getStats controller: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
  async publishAllPosts(req, res) {
    try {
      const result = await publisherService.publishAllPosts();
      res.status(200).json({
        success: true,
        message: 'All posts published successfully',
        result,
      });
    } catch (error) {
      logger.error(`Error in publishAllPosts controller: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
}

module.exports = new BlogController();