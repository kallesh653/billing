const mongoose = require('mongoose');

const mainCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Main code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes (code already has unique index)
mainCodeSchema.index({ isActive: 1 });
mainCodeSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('MainCode', mainCodeSchema);
