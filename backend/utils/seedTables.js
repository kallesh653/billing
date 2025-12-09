const mongoose = require('mongoose');
const Table = require('../models/Table');
require('dotenv').config();

const seedTables = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing tables
    await Table.deleteMany({});
    console.log('🗑️  Cleared existing tables');

    // Create sample tables
    const tables = [
      {
        tableNumber: 'T1',
        tableName: 'Window Table 1',
        seatingCapacity: 2,
        floor: 'Ground',
        location: 'Indoor',
        shape: 'Square',
        displayOrder: 1
      },
      {
        tableNumber: 'T2',
        tableName: 'Window Table 2',
        seatingCapacity: 2,
        floor: 'Ground',
        location: 'Indoor',
        shape: 'Square',
        displayOrder: 2
      },
      {
        tableNumber: 'T3',
        tableName: 'Corner Table',
        seatingCapacity: 4,
        floor: 'Ground',
        location: 'Indoor',
        shape: 'Round',
        displayOrder: 3
      },
      {
        tableNumber: 'T4',
        tableName: 'Family Table',
        seatingCapacity: 6,
        floor: 'Ground',
        location: 'Indoor',
        shape: 'Rectangle',
        displayOrder: 4
      },
      {
        tableNumber: 'T5',
        tableName: 'Outdoor Table 1',
        seatingCapacity: 4,
        floor: 'Ground',
        location: 'Outdoor',
        shape: 'Round',
        displayOrder: 5
      },
      {
        tableNumber: 'T6',
        tableName: 'Outdoor Table 2',
        seatingCapacity: 4,
        floor: 'Ground',
        location: 'Outdoor',
        shape: 'Round',
        displayOrder: 6
      },
      {
        tableNumber: 'B1',
        tableName: 'Balcony Special',
        seatingCapacity: 2,
        floor: 'First',
        location: 'Balcony',
        shape: 'Square',
        displayOrder: 7
      },
      {
        tableNumber: 'B2',
        tableName: 'Balcony Table 2',
        seatingCapacity: 4,
        floor: 'First',
        location: 'Balcony',
        shape: 'Round',
        displayOrder: 8
      },
      {
        tableNumber: 'V1',
        tableName: 'VIP Room 1',
        seatingCapacity: 8,
        floor: 'First',
        location: 'VIP',
        shape: 'Rectangle',
        description: 'Private VIP dining room',
        displayOrder: 9
      },
      {
        tableNumber: 'V2',
        tableName: 'VIP Room 2',
        seatingCapacity: 10,
        floor: 'First',
        location: 'VIP',
        shape: 'Rectangle',
        description: 'Large VIP dining room',
        displayOrder: 10
      },
      {
        tableNumber: 'R1',
        tableName: 'Rooftop Table 1',
        seatingCapacity: 4,
        floor: 'Rooftop',
        location: 'Outdoor',
        shape: 'Round',
        description: 'Scenic rooftop view',
        displayOrder: 11
      },
      {
        tableNumber: 'R2',
        tableName: 'Rooftop Table 2',
        seatingCapacity: 4,
        floor: 'Rooftop',
        location: 'Outdoor',
        shape: 'Round',
        description: 'Scenic rooftop view',
        displayOrder: 12
      }
    ];

    await Table.insertMany(tables);

    console.log('✅ Sample tables created successfully!');
    console.log(`📊 Total tables: ${tables.length}`);
    console.log('\nTables by floor:');
    console.log(`  Ground Floor: ${tables.filter(t => t.floor === 'Ground').length}`);
    console.log(`  First Floor: ${tables.filter(t => t.floor === 'First').length}`);
    console.log(`  Rooftop: ${tables.filter(t => t.floor === 'Rooftop').length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedTables();
