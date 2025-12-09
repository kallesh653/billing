const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCode',
    required: true
  },
  itemName: String,
  transactionType: {
    type: String,
    enum: ['Purchase', 'Sale', 'Adjustment', 'Return'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: String,
  rate: {
    type: Number,
    default: 0
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  referenceType: {
    type: String,
    enum: ['Purchase', 'Bill', 'Order', 'Manual', 'Invoice'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  referenceNo: String,
  balanceQty: {
    type: Number,
    required: true
  },
  remarks: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound indexes
stockLedgerSchema.index({ itemId: 1, transactionDate: -1 });
stockLedgerSchema.index({ transactionType: 1, transactionDate: -1 });

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
