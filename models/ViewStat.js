const mongoose = require('mongoose');

const viewStatSchema = new mongoose.Schema({
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: String, 
    required: true
  },
  hour: {
    type: Number, 
    required: true
  },
  views: {
    type: Number,
    default: 1
  }
}, { timestamps: true });

viewStatSchema.index({ article: 1, date: 1, hour: 1 }, { unique: true });

module.exports = mongoose.model('ViewStat', viewStatSchema);