const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'כתבה ללא כותרת',
    trim: true
  },
  summary: {
    type: String,
    default: '',
    trim: true
  },
  content: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800'
  },
  category: {
    type: String,
    enum: ['חדשות', 'ספורט', 'כלכלה', 'טכנולוגיה', 'תרבות'],
    default: 'חדשות'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'changes_requested'],
    default: 'draft'
  },
  editorFeedback: {
    type: String,
    default: ''
  },
  publishedAt: {
    type: Date
  },
  updateEvents: [{
    updatedAt: { type: Date, default: Date.now },
    note: String
  }],
  viewsCount: {
    type: Number,
    default: 0
  },
  draftVersion: {
    title: String,
    summary: String,
    content: String,
    imageUrl: String,
    category: String,
    lastSavedAt: Date
  }
}, { timestamps: true });

articleSchema.index({ title: 'text', summary: 'text' });

module.exports = mongoose.model('Article', articleSchema);