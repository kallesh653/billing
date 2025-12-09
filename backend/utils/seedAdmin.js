const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const BusinessSettings = require('../models/BusinessSettings');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Check if admin exists
    const adminExists = await User.findOne({ username: 'admin' });

    if (!adminExists) {
      // Create admin user
      await User.create({
        name: 'Administrator',
        username: 'admin',
        password: 'admin123',
        email: 'admin@colddrink.com',
        role: 'admin',
        permissions: {
          canEditPrice: true,
          canGiveDiscount: true,
          maxDiscountPercent: 100,
          canDeleteBill: true,
          canViewReports: true
        }
      });
      console.log('✅ Admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Check if cashier exists
    const cashierExists = await User.findOne({ username: 'cashier' });

    if (!cashierExists) {
      // Create cashier user
      await User.create({
        name: 'Cashier',
        username: 'cashier',
        password: 'cashier123',
        email: 'cashier@colddrink.com',
        role: 'user',
        permissions: {
          canEditPrice: false,
          canGiveDiscount: true,
          maxDiscountPercent: 10,
          canDeleteBill: false,
          canViewReports: false
        }
      });
      console.log('✅ Cashier user created');
      console.log('   Username: cashier');
      console.log('   Password: cashier123');
    } else {
      console.log('ℹ️  Cashier user already exists');
    }

    // Create default business settings
    const settingsExists = await BusinessSettings.findOne();

    if (!settingsExists) {
      await BusinessSettings.create({
        shopName: 'Juicy',
        shopAddress: '123 Main Street, City',
        shopMobile: '+91 9876543210',
        shopEmail: 'shop@colddrink.com',
        gstEnabled: false,
        defaultGstPercent: 5
      });
      console.log('✅ Default business settings created');
    }

    console.log('\n🎉 Setup completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedAdmin();
