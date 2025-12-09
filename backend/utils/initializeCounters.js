const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Bill = require('../models/Bill');
const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/company_management';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const initializeCounters = async () => {
  try {
    console.log('🔧 Initializing Counters...\n');

    // Initialize Bill Counter
    console.log('📄 Checking Bill counter...');
    const lastBill = await Bill.findOne().sort({ billNo: -1 }).select('billNo');
    const currentBillNo = lastBill ? lastBill.billNo : 0;

    const billCounter = await Counter.findOneAndUpdate(
      { key: 'bill' },
      {
        $setOnInsert: { seq: currentBillNo, description: 'Bill numbering counter' }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (billCounter.seq < currentBillNo) {
      // Update if existing counter is behind
      await Counter.updateOne(
        { key: 'bill' },
        { $set: { seq: currentBillNo } }
      );
      console.log(`   ✅ Bill counter updated: ${billCounter.seq} → ${currentBillNo}`);
    } else {
      console.log(`   ✅ Bill counter: ${billCounter.seq} (current)`);
    }

    // Check Invoice Counters (there can be multiple for different types and months)
    console.log('\n📋 Checking Invoice counters...');
    const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(100);

    if (invoices.length > 0) {
      console.log(`   Found ${invoices.length} recent invoices`);

      // Group by invoice type and date to find max sequences
      const counterKeys = new Set();
      invoices.forEach(inv => {
        if (inv.invoiceNumber) {
          // Extract counter key from invoice number (e.g., INV2511 from INV/2511/0001)
          const match = inv.invoiceNumber.match(/^([A-Z]+)\/(\d{4})/);
          if (match) {
            const key = `${match[1]}${match[2]}`;
            counterKeys.add(key);
          }
        }
      });

      console.log(`   Found ${counterKeys.size} unique counter keys`);

      for (const key of counterKeys) {
        const counterDoc = await Counter.findOne({ key });
        if (counterDoc) {
          console.log(`   ✅ Counter '${key}': ${counterDoc.seq}`);
        } else {
          console.log(`   ℹ️  Counter '${key}': Not yet initialized (will be created on next invoice)`);
        }
      }
    } else {
      console.log('   ℹ️  No invoices found - counters will initialize on first invoice creation');
    }

    console.log('\n✅ Counter initialization complete!\n');
    console.log('Summary:');
    console.log('--------');
    const allCounters = await Counter.find();
    allCounters.forEach(counter => {
      console.log(`   ${counter.key}: ${counter.seq} ${counter.description ? `(${counter.description})` : ''}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing counters:', error);
    process.exit(1);
  }
};

// Run the initialization
connectDB().then(() => {
  initializeCounters();
});
