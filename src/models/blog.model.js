const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    unique: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  subcategory: {
    type: String,
    required: [true, 'Subcategory is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  wordCount: {
    type: Number,
    default: 0
  },
  similarityScore: {
    type: Number,
    default: 0
  },
  slug: {
    type: String,
    unique: true,
    required: [true, 'Slug is required'],
    trim: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for blog URL
BlogSchema.virtual('url').get(function() {
  return `/blog/${this._id}`;
});

// Calculate word count before saving
BlogSchema.pre('save', function(next) {
  if (this.content) {
    this.wordCount = this.content.split(/\s+/).length;
  }
  next();
});

// Text indexes for efficient searching and duplicate detection
BlogSchema.index({ title: 'text', content: 'text' });
BlogSchema.index({ category: 1, subcategory: 1 });
BlogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Blog', BlogSchema);