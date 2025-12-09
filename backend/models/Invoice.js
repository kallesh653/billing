const mongoose = require('mongoose');
const Counter = require('./Counter');

const invoiceItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCode'
  },
  itemName: {
    type: String,
    required: true
  },
  itemCode: String,
  description: String,
  hsnCode: String,
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    default: 'Pcs'
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  taxRate: {
    type: Number,
    default: 0
  },
  cgst: {
    type: Number,
    default: 0
  },
  sgst: {
    type: Number,
    default: 0
  },
  igst: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  invoicePrefix: {
    type: String,
    default: 'INV'
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  customerDetails: {
    customerCode: String,
    customerName: String,
    companyName: String,
    email: String,
    mobile: String,
    gstNumber: String,
    billingAddress: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    },
    shippingAddress: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    }
  },
  items: [invoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  totalCGST: {
    type: Number,
    default: 0
  },
  totalSGST: {
    type: Number,
    default: 0
  },
  totalIGST: {
    type: Number,
    default: 0
  },
  shippingCharges: {
    type: Number,
    default: 0
  },
  otherCharges: {
    type: Number,
    default: 0
  },
  roundOff: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true
  },
  amountInWords: {
    type: String
  },
  paymentTerms: {
    type: String,
    default: 'Immediate'
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid', 'Overdue'],
    default: 'Unpaid'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Cheque', 'Bank Transfer', 'Multiple'],
    default: 'Cash'
  },
  paymentHistory: [{
    date: { type: Date, default: Date.now },
    amount: Number,
    paymentMode: String,
    reference: String,
    notes: String,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  invoiceType: {
    type: String,
    enum: ['Tax Invoice', 'Proforma Invoice', 'Credit Note', 'Debit Note', 'Estimate', 'Quotation'],
    default: 'Tax Invoice'
  },
  templateType: {
    type: String,
    enum: ['Classic', 'Modern', 'Minimal', 'Professional', 'Colorful'],
    default: 'Classic'
  },
  notes: {
    type: String
  },
  termsAndConditions: {
    type: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Viewed', 'Paid', 'Cancelled', 'Overdue'],
    default: 'Draft'
  },
  isEmailSent: {
    type: Boolean,
    default: false
  },
  emailSentDate: {
    type: Date
  },
  isPrinted: {
    type: Boolean,
    default: false
  },
  printedDate: {
    type: Date
  },
  printCount: {
    type: Number,
    default: 0
  },
  pdfPath: {
    type: String
  },
  linkedBill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill'
  },
  linkedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for faster queries
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ paymentStatus: 1 });
invoiceSchema.index({ createdBy: 1 });

function getTypeCode(type) {
  switch (type) {
    case 'Tax Invoice': return 'INV';
    case 'Proforma Invoice': return 'PRO';
    case 'Credit Note': return 'CRN';
    case 'Debit Note': return 'DBN';
    case 'Estimate': return 'EST';
    case 'Quotation': return 'QTN';
    default: return 'INV';
  }
}

invoiceSchema.pre('validate', async function(next) {
  try {
    if (this.isNew && !this.invoiceNumber) {
      const code = getTypeCode(this.invoiceType || 'Tax Invoice');
      const now = this.invoiceDate ? new Date(this.invoiceDate) : new Date();
      const year = now.getFullYear().toString().substr(-2);
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const key = `${code}${year}${month}`;

      const counter = await Counter.findOneAndUpdate(
        { key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      const seqStr = String(counter.seq).padStart(4, '0');
      this.invoiceNumber = `${code}/${year}${month}/${seqStr}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

invoiceSchema.pre('save', async function(next) {
  this.balanceAmount = this.grandTotal - this.paidAmount;

  if (this.paidAmount === 0) {
    this.paymentStatus = 'Unpaid';
  } else if (this.paidAmount >= this.grandTotal) {
    this.paymentStatus = 'Paid';
  } else {
    this.paymentStatus = 'Partially Paid';
  }

  if (this.dueDate && new Date() > this.dueDate && this.paymentStatus !== 'Paid') {
    this.paymentStatus = 'Overdue';
  }

  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
