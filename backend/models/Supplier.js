const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplierName: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  totalPurchased: {
    type: Number,
    default: 0
  },
  totalPending: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
supplierSchema.index({ supplierName: 1 });
supplierSchema.index({ mobile: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
