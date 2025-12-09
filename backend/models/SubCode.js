const mongoose = require('mongoose');

const subCodeSchema = new mongoose.Schema({
  subCode: {
    type: String,
    required: [true, 'Product code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    enum: ['Piece', 'Box', 'Packet', 'KG', 'Gram', 'Liter', 'ML', 'Bundle', 'Carton'],
    default: 'Piece'
  },
  currentStock: {
    type: Number,
    min: 0  // No default - undefined means unlimited stock
  },
  minStockAlert: {
    type: Number,
    min: 0  // No default - only used when stock tracking is enabled
  },
  hsnCode: {
    type: String,
    trim: true
  },
  gstPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  imageUrl: {
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

// Indexes (subCode already has unique index)
subCodeSchema.index({ isActive: 1 });
subCodeSchema.index({ currentStock: 1 });
subCodeSchema.index({ name: 1 });

// Virtual for stock alert
subCodeSchema.virtual('isLowStock').get(function() {
  // Only check if stock tracking is enabled
  if (this.currentStock === undefined || this.currentStock === null) return false;
  if (this.minStockAlert === undefined || this.minStockAlert === null) return false;
  return this.currentStock <= this.minStockAlert;
});

module.exports = mongoose.model('SubCode', subCodeSchema);
