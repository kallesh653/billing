# 🍹 Cold Drink Shop Billing System

A complete, professional billing and inventory management system built with **MERN Stack** (MongoDB, Express.js, React.js, Node.js) and **Ant Design**.

## ✨ Features

### 🔐 **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (Admin & User)
- Secure password hashing with bcrypt

### 👨‍💼 **Admin Features**
- Complete dashboard with sales analytics
- Main Code & Sub Code (Category & Items) management
- Supplier management
- Purchase entry with automatic stock updates
- User management with custom permissions
- Stock management and low-stock alerts
- Comprehensive reports (9 types)
- Bill cancellation and editing

### 👤 **User Features**
- User-friendly dashboard
- Quick order taking with Main Code → Sub Code selection
- Real-time stock checking
- Multiple payment modes (Cash, UPI, Card)
- Discount application (if permitted)
- Bill generation and printing
- Personal sales tracking

### 📊 **Reports**
1. Sales Report (Date-wise, User-wise)
2. Item-wise Sales Analysis
3. User-wise Performance Report
4. Daily Collection Summary
5. Purchase Summary
6. Purchase Item Report
7. Supplier Report
8. Stock Report with Low Stock Alerts
9. Profit & Loss Report

### 🖨️ **Additional Features**
- Thermal printer support (ESC/POS)
- Automatic stock ledger maintenance
- Real-time inventory updates
- Beautiful, responsive UI with Ant Design
- Professional gradient themes

---

## 🚀 Tech Stack

### **Backend**
- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- bcryptjs for password hashing
- node-thermal-printer for printing
- Express Validator for validation

### **Frontend**
- React.js 18
- Ant Design 5 (UI Framework)
- Vite (Build tool)
- Axios (API calls)
- React Router v6
- Recharts (Data visualization)

---

## 📦 Installation & Setup

### **Prerequisites**
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### **Step 1: Clone the Repository**
```bash
cd c:/Users/LEN0VO/Desktop/colddrink
```

### **Step 2: Backend Setup**

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (already created, verify settings)
# Make sure MongoDB is running on your system

# Seed admin user
npm run seed

# Start backend server
npm run dev
```

Backend will run on **http://localhost:5000**

### **Step 3: Frontend Setup**

Open a new terminal:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start frontend development server
npm run dev
```

Frontend will run on **http://localhost:3000**

---

## 🔑 Default Credentials

After running `npm run seed` in the backend:

- **Username:** `admin`
- **Password:** `admin123`

---

## 📁 Project Structure

```
colddrink/
├── backend/
│   ├── config/          # Database connection
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & error handling
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
│
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── auth/
│   │   │   ├── common/
│   │   │   ├── dashboard/
│   │   │   ├── masters/
│   │   │   ├── billing/
│   │   │   ├── purchase/
│   │   │   ├── stock/
│   │   │   └── reports/
│   │   ├── context/     # Auth context
│   │   ├── services/    # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
│
└── README.md
```

---

## 🎯 Usage Guide

### **For Admin:**

1. **Login** with admin credentials
2. **Set up Main Codes** (Categories) - e.g., Juices, Soda, Ice Cream
3. **Add Sub Codes** (Items) under each Main Code
4. **Add Suppliers** for purchase tracking
5. **Create Users** for billing staff
6. **Enter Purchases** to update stock automatically
7. **View Reports** for business insights

### **For User (Billing Staff):**

1. **Login** with user credentials
2. **Click "Take Order"**
3. **Select Main Code** (Category)
4. **Select Sub Code** (Item) - items are filtered by category
5. **Add items to cart**, adjust quantities
6. **Enter customer details** (optional)
7. **Apply discount** (if permitted)
8. **Select payment mode**
9. **Generate Bill** - stock automatically reduces

---

## 🌐 API Endpoints

### **Authentication**
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - Register user (admin only)
- GET `/api/auth/me` - Get current user
- GET `/api/auth/users` - Get all users (admin)

### **Main Codes**
- GET `/api/maincodes` - Get all main codes
- POST `/api/maincodes` - Create main code (admin)
- PUT `/api/maincodes/:id` - Update main code (admin)
- DELETE `/api/maincodes/:id` - Delete main code (admin)

### **Sub Codes**
- GET `/api/subcodes` - Get all sub codes
- GET `/api/subcodes/main/:mainCodeId` - Get by main code
- POST `/api/subcodes` - Create sub code (admin)
- PUT `/api/subcodes/:id` - Update sub code (admin)

### **Billing**
- POST `/api/bills` - Create bill
- GET `/api/bills` - Get all bills
- GET `/api/bills/summary/today` - Today's summary
- PUT `/api/bills/:id/cancel` - Cancel bill (admin)

### **Purchase**
- POST `/api/purchases` - Create purchase (admin)
- GET `/api/purchases` - Get all purchases (admin)

### **Reports**
- GET `/api/reports/sales` - Sales report
- GET `/api/reports/itemwise-sales` - Item-wise sales
- GET `/api/reports/userwise-sales` - User-wise sales
- GET `/api/reports/daily-collection` - Daily collection
- GET `/api/reports/stock` - Stock report
- GET `/api/reports/profit` - Profit report

---

## 🔧 Configuration

### **Database**
Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/colddrink_billing
```

### **JWT Secret**
```env
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=30d
```

### **Thermal Printer**
Configure printer settings in `backend/.env`:
```env
PRINTER_NAME=ThermalPrinter
PRINTER_WIDTH=48
```

---

## 🎨 UI Screenshots

- **Beautiful gradient dashboard cards**
- **Responsive design** - works on desktop, tablet, and mobile
- **Professional sidebar navigation**
- **Clean, modern interface** with Ant Design components
- **Real-time stock alerts** with color-coded tags
- **Interactive billing interface** with live calculations

---

## 🐛 Troubleshooting

### Backend won't start
- Ensure MongoDB is running: `mongod`
- Check port 5000 is not in use
- Verify .env file exists and is configured

### Frontend won't start
- Delete `node_modules` and reinstall: `npm install`
- Check port 3000 is available
- Ensure backend is running

### Login issues
- Run seed script: `npm run seed` in backend folder
- Clear browser cache and localStorage
- Check MongoDB connection

---

## 📝 Future Enhancements

- [ ] Barcode scanning support
- [ ] Excel/PDF export for all reports
- [ ] SMS notifications for low stock
- [ ] Multi-store support
- [ ] Customer loyalty program
- [ ] GST invoice generation
- [ ] Dark mode toggle
- [ ] Mobile app version

---

## 👨‍💻 Development

### Run in development mode:
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Build for production:
```bash
# Frontend
cd frontend && npm run build
```

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🤝 Support

For issues or questions, create an issue in the repository.

---

## 🎉 Acknowledgments

- Built with ❤️ using MERN Stack
- UI powered by Ant Design
- Icons by Ant Design Icons

---

**Made with 💙 for Cold Drink Shop Owners**
# billing
