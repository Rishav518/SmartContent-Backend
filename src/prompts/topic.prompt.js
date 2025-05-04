/**
 * Prompt templates for generating blog topics
 */
module.exports = {
  /**
   * Basic topic generation prompt
   */
  basic: `
    Generate a unique and engaging blog post topic with the following structure:
    
    1. Title: A catchy, SEO-friendly title
    2. Category: Select the most appropriate category
    3. Subcategory: Select the most appropriate subcategory
    
    The topic should be informative, unique, and have potential for ranking well in search engines.
  `,
  
  /**
   * Topic generation with specific category
   * @param {string} category - The category to focus on
   * @returns {string} - Generated prompt
   */
  withCategory: (category) => `
    Generate a unique and engaging blog post topic in the "${category}" category with the following structure:
    
    1. Title: A catchy, SEO-friendly title related to ${category}
    2. Category: ${category}
    3. Subcategory: Select the most appropriate subcategory within ${category}
    
    The topic should be informative, unique, and have potential for ranking well in search engines.
  `,
  
  /**
   * Topic generation with keywords
   * @param {Array<string>} keywords - Keywords to include
   * @returns {string} - Generated prompt
   */
  withKeywords: (keywords) => `
    Generate a unique and engaging blog post topic that incorporates some of these keywords: ${keywords.join(', ')}.
    
    The response should have the following structure:
    
    1. Title: A catchy, SEO-friendly title that includes at least one of the keywords
    2. Category: Select the most appropriate category
    3. Subcategory: Select the most appropriate subcategory
    
    The topic should be informative, unique, and have potential for ranking well in search engines.
  `,
  
  /**
   * Topic generation for avoiding duplicates
   * @param {string} existingTitle - Existing title to avoid similarity with
   * @returns {string} - Generated prompt
   */
  avoidDuplicate: (existingTitle) => `
    Generate a unique and engaging blog post topic that is COMPLETELY DIFFERENT from this existing topic: "${existingTitle}".
    
    The response should have the following structure:
    
    1. Title: A catchy, SEO-friendly title that is not similar to the existing title
    2. Category: Select the most appropriate category
    3. Subcategory: Select the most appropriate subcategory
    
    The topic should be informative, unique, and have potential for ranking well in search engines.
  `
};