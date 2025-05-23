const mongoose = require('mongoose');
const Blog = require('../models/blog.model');
const logger = require('../utils/logger');
const { getAllBlogTitles } = require('../utils/modelService');

/**
 * Service for validating topics and checking content duplication
 */
class ValidatorService {

  async isTopicUnique(title) {
    if (!title) return false;

    try {
      const normalizedTitle = title.toLowerCase().trim();
      const allTitles = await getAllBlogTitles();

      if (allTitles.includes(normalizedTitle)) {
        logger.info(`Exact match found for title: "${normalizedTitle}"`);
        return false;
      }

      // Fuzzy DB check
      const fuzzyMatch = await Blog.findOne({
        title: { $regex: new RegExp(normalizedTitle, 'i') }
      });

      if (fuzzyMatch) {
        logger.info(`Fuzzy match found for title: "${normalizedTitle}"`);
        return false;
      }
      // check for same slug (convert to slug and check it)
      const slug = this.generateSlug(title);
      const slugMatch = await Blog.findOne({
        slug: { $regex: new RegExp(slug, 'i') }
      });
      if (slugMatch) {
        logger.info(`Slug match found for title: "${normalizedTitle}"`);
        return false;
      }

      return true;
    } catch (err) {
      logger.error(`Validator error (title uniqueness): ${err.message}`);
      return false;
    }
  }

  async checkContentSimilarity(content) {
    if (!content || content.length < 100) {
      return { isSimilar: false, similarityScore: 0 };
    }

    try {
      const keyPhrases = this.extractKeyPhrases(content);
      const searchQuery = keyPhrases.map(p => `"${p.trim()}"`).join(' ');

      const [similarMatch] = await Blog.find(
        { $text: { $search: searchQuery } },
        { score: { $meta: 'textScore' } }
      ).sort({ score: { $meta: 'textScore' } }).limit(1);
      logger.info(`Similarity check: ${similarMatch ? 'found' : 'not found'}`);
      if (similarMatch && similarMatch._doc.score > 1.5) {
        return {
          isSimilar: true,
          similarityScore: similarMatch._doc.score,
          similarPostId: similarMatch._id,
        };
      }
      return { isSimilar: false, similarityScore: 0 };
    } catch (err) {
      logger.error(`Validator error (content similarity): ${err.message}`);
      return { isSimilar: false, similarityScore: 0 };
    }
  }

  extractKeyPhrases(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30);
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 100);

    return [
      ...this.getRandomElements(sentences, 3),
      ...this.getRandomElements(paragraphs, 2)
    ];
  }

  getRandomElements(array, count) {
    const result = [];
    const usedIndices = new Set();

    while (result.length < count && usedIndices.size < array.length) {
      const index = Math.floor(Math.random() * array.length);
      if (!usedIndices.has(index)) {
        result.push(array[index]);
        usedIndices.add(index);
      }
    }

    return result;
  }
  
  generateSlug(title) {
    return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with '-'
    .replace(/^-|-$/g, ''); // Remove leading/trailing '-'
  }
  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((acc, val) => acc + val * val, 0));
    return vector.map(val => val / magnitude);
  }
  
  async checkEmbeddingSimilarity(embedding) {
    try {
      const similarMatch = await Blog.aggregate([
        {
          $vectorSearch: {
            index: 'vectorIndex',
            path: 'embedding',
            queryVector: normalizeVector(embedding[0]),
            numCandidates: 100,
            limit: 1,
            similarity: 'cosine'
          }
        },
        {
          $project: {
            _id: 1,
            distance: { $meta: "vectorSearchScore" },
            title: 1
          }
        }
      ]);
      
  
      if (similarMatch.length > 0) {
        const similarityScore = similarMatch[0].distance;
        return {
          isSimilar: true,
          similarityScore,
          similarPostId: similarMatch[0]._id,
        };
      }
  
      return { isSimilar: false, similarityScore: 0 };
    } catch (err) {
      logger.error(`Validator error (embedding similarity): ${err.message}`);
      return { isSimilar: false, similarityScore: 0 };
    }
  }
  
}
  
module.exports = new ValidatorService();
