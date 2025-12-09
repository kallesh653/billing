const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/maincodes', require('./routes/mainCodeRoutes'));
app.use('/api/subcodes', require('./routes/subCodeRoutes'));
app.use('/api/bills', require('./routes/billingRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// New routes for company management system
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/company-profile', require('./routes/companyProfileRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Company Management System API is running',
    timestamp: new Date()
  });
});

// Error handler
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🏢 Company Management System API                   ║
║                                                       ║
║   Server running in ${process.env.NODE_ENV} mode           ║
║   Port: ${PORT}                                        ║
║   URL: http://localhost:${PORT}                       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
