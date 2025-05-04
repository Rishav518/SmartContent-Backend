/**
 * Prompt templates for generating blog content
 */
module.exports = {
  /**
   * Generate a blog post based on title and category
   * @param {Object} options - Options for the prompt
   * @returns {string} - Generated prompt
   */
  generatePost: (options) => {
    const { title, category, subcategory, minWords = 600, maxWords = 1200, tone = 'informative' } = options;
    
    return `
      Write a comprehensive, well-structured blog post with the title "${title}" in the ${category} category and ${subcategory} subcategory.
      
      Requirements:
      - Word count: Between ${minWords} and ${maxWords} words
      - Tone: ${tone}
      - Structure: Include an introduction, multiple sections with headings, and a conclusion
      - Format: Use proper markdown formatting
      - SEO: Optimize the content for search engines while keeping it valuable for readers
      - Make it informative, engaging, and unique
      
      The blog post should be written in a way that establishes expertise and authority on the topic.
      Include practical examples, data, or case studies where appropriate.
      Write with correct grammar, spelling, and punctuation.
      
      Output the blog post content only, without any meta commentary.
    `;
  },
  
  /**
   * Generate a blog post that avoids similarity with existing content
   * @param {Object} options - Options for the prompt
   * @returns {string} - Generated prompt 
   */
  generateUniquePost: (options) => {
    const { title, category, subcategory, avoidSimilarTo, minWords = 600, maxWords = 1200, tone = 'informative' } = options;
    
    return `
      Write a comprehensive, well-structured blog post with the title "${title}" in the ${category} category and ${subcategory} subcategory.
      
      IMPORTANT: Your content must be COMPLETELY DIFFERENT and NOT SIMILAR to the following existing content:
      
      ${avoidSimilarTo}
      
      Requirements:
      - Word count: Between ${minWords} and ${maxWords} words
      - Tone: ${tone}
      - Structure: Include an introduction, multiple sections with headings, and a conclusion
      - Format: Use proper markdown formatting
      - SEO: Optimize the content for search engines while keeping it valuable for readers
      - Make it informative, engaging, and UNIQUE
      
      Take a totally different approach, use different examples, and structure the article differently than the example provided.
      The blog post should be written in a way that establishes expertise and authority on the topic.
      
      Output the blog post content only, without any meta commentary.
    `;
  }
};