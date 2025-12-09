const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    enum: ['Raw Material', 'Packaging', 'Shop Supply', 'Other'],
    default: 'Raw Material'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    default: 'Piece'
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true
  },
  description: String,
  addToStock: {
    type: Boolean,
    default: false
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCode'
  }
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  purchaseNo: {
    type: String,
    unique: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  supplierName: String,
  supplierMobile: String,
  invoiceNo: {
    type: String,
    trim: true,
    default: 'N/A'
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  invoiceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Partial', 'Pending'],
    default: 'Pending'
  },
  items: [purchaseItemSchema],
  remarks: {
    type: String,
    trim: true
  },
  // GST fields (optional for local purchases)
  gstAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  cgst: {
    type: Number,
    default: 0,
    min: 0
  },
  sgst: {
    type: Number,
    default: 0,
    min: 0
  },
  igst: {
    type: Number,
    default: 0,
    min: 0
  },
  isLocalPurchase: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes (purchaseNo already has unique index)
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ invoiceDate: -1 });
purchaseSchema.index({ paymentStatus: 1 });

// Auto-generate purchase number
purchaseSchema.pre('save', async function(next) {
  if (!this.purchaseNo) {
    const count = await mongoose.model('Purchase').countDocuments();
    this.purchaseNo = `PUR${String(count + 1).padStart(6, '0')}`;
  }

  // Calculate pending amount
  this.pendingAmount = this.invoiceAmount - this.paidAmount;

  // Update payment status
  if (this.paidAmount === 0) {
    this.paymentStatus = 'Pending';
  } else if (this.paidAmount >= this.invoiceAmount) {
    this.paymentStatus = 'Paid';
  } else {
    this.paymentStatus = 'Partial';
  }

  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);
