const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const os = require('os');

let mongod = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/company_management';

    // Check if external MongoDB is available
    if (mongoUri && mongoUri.includes('localhost')) {
      try {
        // Try connecting to external MongoDB first with longer timeout
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 30000,
          connectTimeoutMS: 30000,
          socketTimeoutMS: 30000
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        return;
      } catch (err) {
        console.log('⚠️  External MongoDB not found, starting embedded MongoDB...');
        console.log('Error:', err.message);
      }
    }

    // Start embedded MongoDB with persistent storage
    const fs = require('fs');
    const dbPath = path.join(os.homedir(), 'ColdDrinkBilling', 'database');

    // Create directory if it doesn't exist
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    mongod = await MongoMemoryServer.create({
      instance: {
        dbPath: dbPath,
        storageEngine: 'wiredTiger'
      },
      binary: {
        version: '6.0.12',
        downloadDir: path.join(os.homedir(), 'ColdDrinkBilling', 'mongodb-binaries')
      }
    }, 60000); // 60 second timeout for embedded MongoDB startup

    mongoUri = mongod.getUri();

    const conn = await mongoose.connect(mongoUri, {
      dbName: 'colddrink_billing',
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000
    });

    console.log(`✅ Embedded MongoDB Started`);
    console.log(`📁 Data stored at: ${dbPath}`);
    console.log(`📊 Database: colddrink_billing`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error('Database connection failed. Please ensure MongoDB is available.');
  }
};

// Graceful shutdown
const closeDB = async () => {
  if (mongod) {
    await mongod.stop();
  }
  await mongoose.connection.close();
};

process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

module.exports = connectDB;
