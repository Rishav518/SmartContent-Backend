const mongoose = require('mongoose');
const Blog = require('../models/blog.model');

async function getPostBySlug(slug) {
  if (!mongoose.connection.readyState) {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  const post = await Blog.findOne({ slug }).lean();
  return post;
}

module.exports = {
  getPostBySlug,
};
