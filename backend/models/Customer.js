const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: true
  },
  alternatePhone: {
    type: String
  },
  gstNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  panNumber: {
    type: String,
    uppercase: true,
    trim: true
  },
  billingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String
  },
  shippingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String,
    sameAsBilling: { type: Boolean, default: true }
  },
  shippingAddresses: [{
    companyName: String,
    gstNumber: String,
    panNumber: String,
    mobile: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    pincode: String
  }],
  customerType: {
    type: String,
    enum: ['Regular', 'Wholesale', 'Retail', 'Distributor', 'Corporate'],
    default: 'Regular'
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  creditDays: {
    type: Number,
    default: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  totalInvoices: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries (customerCode already has unique index)
customerSchema.index({ mobile: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ customerName: 'text', companyName: 'text' });

// Auto-generate customer code
// Note: Controller handles customerCode generation manually, so this is a fallback
customerSchema.pre('save', async function(next) {
  if (this.isNew && !this.customerCode) {
    const count = await this.constructor.countDocuments();
    this.customerCode = `CUST${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
