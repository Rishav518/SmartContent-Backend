const Blog = require('../models/blog.model');
const logger = require('../utils/logger');
const { getPostBySlug } = require('../utils/slug');
/**
 * Service for publishing generated content to the database
 */
class PublisherService {

  async savePost(blogData) {
    try {
      const { title, content, category, subcategory, slug } = blogData;
      
      // Validate required fields
     if (!title || !content) {
        throw new Error('Title and content are required');
      }
      if (!category || !subcategory) {
        throw new Error('Category and subcategory are required');
      }
      
      
      logger.info(`Saving blog post: "${title}"`);
      
      // Create new blog post
      const newPost = new Blog({
        title,
        content,
        category,
        subcategory,
        status: blogData.status || 'draft',
        slug: slug,
        similarityScore: blogData.similarityScore || 0
      });
      
      // Save to database
      const savedPost = await newPost.save();
      
      logger.info(`Successfully saved blog post with ID: ${savedPost._id}`);
      return savedPost;
    } catch (error) {
      logger.error(`Error saving blog post: ${error.message}`);
      throw error;
    }
  }
  
  async updatePostStatus(postId, status) {
    try {
      if (!['draft', 'published', 'archived'].includes(status)) {
        throw new Error('Invalid status value');
      }
      
      const updatedPost = await Blog.findByIdAndUpdate(
        postId,
        { status },
        { new: true, runValidators: true }
      );
      
      if (!updatedPost) {
        throw new Error(`Blog post with ID ${postId} not found`);
      }
      
      logger.info(`Updated blog post ${postId} status to ${status}`);
      return updatedPost;
    } catch (error) {
      logger.error(`Error updating post status: ${error.message}`);
      throw error;
    }
  }
  
  async getPosts(options = {}) {
    try {
      const page = parseInt(options.page);
      const limit = parseInt(options.limit);
      const skip = (page - 1) * limit;
      
      // Build query
      const query = {};
      
      if (options.status) {
        query.status = options.status;
      }
      
      if (options.category) {
        query.category = options.category;
      }
      
      if (options.subcategory) {
        query.subcategory = options.subcategory;
      }
      if (options.search) {
        const searchRegex = new RegExp(options.search, 'i');
        query.$or = [
          { title: searchRegex },
          { content: searchRegex }
        ];
      }
      
      // Execute query with pagination
      const posts = await Blog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // Get total count for pagination
      const total = await Blog.countDocuments(query);
      
      return {
        posts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Error retrieving blog posts: ${error.message}`);
      throw error;
    }
  }
  
  async getPostById(postId) {
    try {
      const post = await Blog.findById(postId);
      
      if (!post) {
        throw new Error(`Blog post with ID ${postId} not found`);
      }
      
      return post;
    } catch (error) {
      logger.error(`Error retrieving blog post: ${error.message}`);
      throw error;
    }
  }
  async updatePostSlug(postId, slug) {
    try {
      const updatedPost = await Blog.findByIdAndUpdate(
        postId,
        { slug },
        { new: true, runValidators: true }
      );
      
      if (!updatedPost) {
        throw new Error(`Blog post with ID ${postId} not found`);
      }
      
      logger.info(`Updated blog post ${postId} slug to ${slug}`);
      return updatedPost;
    } catch (error) {
      logger.error(`Error updating post slug: ${error.message}`);
      throw error;
    }
  }
  async getPostBySlug(slug) {
    try {
      const post = await getPostBySlug(slug);
      
      if (!post) {
        throw new Error(`Blog post with slug ${slug} not found`);
      }
      
      return post;
    } catch (error) {
      logger.error(`Error retrieving blog post by slug: ${error.message}`);
      throw error;
    }
}
  async getCategories() {
    try {
      const categories = await Blog.distinct('category');
      return categories;
    } catch (error) {
      logger.error(`Error retrieving categories: ${error.message}`);
      throw error;
    }
  }
  async getSubcategories(category) {
    try {
      const subcategories = await Blog.distinct('subcategory', { category });
      return subcategories;
    } catch (error) {
      logger.error(`Error retrieving subcategories: ${error.message}`);
      throw error;
    }
  }
  async getStats() {
    try {
      const totalPosts = await Blog.countDocuments();
      const publishedPosts = await Blog.countDocuments({ status: 'published' });
      const draftPosts = await Blog.countDocuments({ status: 'draft' });
      const archivedPosts = await Blog.countDocuments({ status: 'archived' });
      // total categories with their subcategories and count of posts
      const categories = await Blog.aggregate([
        {
          $group: {
            _id: { category: '$category', subcategory: '$subcategory' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            category: '$_id.category',
            subcategory: '$_id.subcategory',
            count: 1
          }
        }
      ]);
      // total posts in each category
      const categoryCounts = await Blog.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            category: '$_id',
            count: 1
          }
        }
      ]);
      // average word count of all posts
      const averageWordCount = await Blog.aggregate([
        {
          $group: {
            _id: null,
            averageWordCount: { $avg: '$wordCount' }
          }
        }
      ]);
      // average similarity score of all posts
      const averageSimilarityScore = await Blog.aggregate([
        {
          $group: {
            _id: null,
            averageSimilarityScore: { $avg: '$similarityScore' }
          }
        }
      ]);
      // word count distribution
      const wordCountDistribution = await Blog.aggregate([
        {
          $bucket: {
            groupBy: '$wordCount',
            boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000],
            default: 'Other',
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]);
      // latest 10 posts without content
      const latestPosts = await Blog.find({}, { content: 0 })
        .sort({ createdAt: -1 })
        .limit(10);

      //Posts Generated Over Time
      const postsGeneratedOverTime = await Blog.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: -1 }
        }
      ]);
      // top 10 categories with maximum posts
      const topCategories = await Blog.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ]);
      return {
        totalPosts,
        publishedPosts,
        draftPosts,
        archivedPosts,
        categories,
        categoryCounts,
        averageWordCount: averageWordCount[0]?.averageWordCount || 0,
        averageSimilarityScore: averageSimilarityScore[0]?.averageSimilarityScore || 0,
        wordCountDistribution,
        latestPosts,
        postsGeneratedOverTime,
        topCategories
      };
    } catch (error) {
      logger.error(`Error retrieving stats: ${error.message}`);
      throw error;
    }
  }
  async publishAllPosts() {
    try {
      // update all posts status fromm draft to published
      const updatedPosts = await Blog.updateMany(
        { status: 'draft' },
        { status: 'published' }
      );
      return updatedPosts.length;
    } catch (error) {
      logger.error(`Error publishing all posts: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new PublisherService();