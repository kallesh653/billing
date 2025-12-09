import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './components/auth/Login';
import AdminDashboard from './components/dashboard/AdminDashboard';
import UserDashboard from './components/dashboard/UserDashboard';
import MainCodeMaster from './components/masters/MainCodeMaster';
import SubCodeMaster from './components/masters/SubCodeMaster';
import SupplierMaster from './components/masters/SupplierMaster';
import UserMaster from './components/masters/UserMaster';
import CustomerMaster from './components/masters/CustomerMaster';
import TakeOrder from './components/billing/TakeOrder';
import ViewBills from './components/billing/ViewBills';
import InvoiceManagement from './components/invoices/InvoiceManagement';
import CreateInvoice from './components/invoices/CreateInvoice';
import AddPurchase from './components/purchase/AddPurchase';
import ViewPurchases from './components/purchase/ViewPurchases';
import StockView from './components/stock/StockView';
import SalesReport from './components/reports/SalesReport';
import ItemwiseSales from './components/reports/ItemwiseSales';
import UserwiseSales from './components/reports/UserwiseSales';
import DailyCollection from './components/reports/DailyCollection';
import PurchaseSummary from './components/reports/PurchaseSummary';
import StockReport from './components/reports/StockReport';
import ProfitReport from './components/reports/ProfitReport';
import SupplierReport from './components/reports/SupplierReport';
import BusinessSettings from './components/settings/BusinessSettings';
import CompanyProfile from './components/settings/CompanyProfile';
import HomepageManager from './components/settings/HomepageManager';
import Homepage from './components/public/Homepage';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Homepage */}
      <Route path="/" element={<Homepage />} />

      {/* Login Route */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />

      {/* Dashboard Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
          </ProtectedRoute>
        }
      />

      {/* Masters - Admin Only */}
      <Route
        path="/masters/maincodes"
        element={
          <ProtectedRoute adminOnly>
            <MainCodeMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/subcodes"
        element={
          <ProtectedRoute adminOnly>
            <SubCodeMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/suppliers"
        element={
          <ProtectedRoute adminOnly>
            <SupplierMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/users"
        element={
          <ProtectedRoute adminOnly>
            <UserMaster />
          </ProtectedRoute>
        }
      />
      <Route
        path="/masters/customers"
        element={
          <ProtectedRoute adminOnly>
            <CustomerMaster />
          </ProtectedRoute>
        }
      />

      {/* Invoices */}
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <InvoiceManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/create"
        element={
          <ProtectedRoute>
            <CreateInvoice />
          </ProtectedRoute>
        }
      />

      {/* Billing */}
      <Route
        path="/billing/take-order"
        element={
          <ProtectedRoute>
            <TakeOrder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing/view-bills"
        element={
          <ProtectedRoute>
            <ViewBills />
          </ProtectedRoute>
        }
      />

      {/* Purchase - Admin Only */}
      <Route
        path="/purchase/add"
        element={
          <ProtectedRoute adminOnly>
            <AddPurchase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/purchase/view"
        element={
          <ProtectedRoute adminOnly>
            <ViewPurchases />
          </ProtectedRoute>
        }
      />

      {/* Stock - Admin Only */}
      <Route
        path="/stock"
        element={
          <ProtectedRoute adminOnly>
            <StockView />
          </ProtectedRoute>
        }
      />

      {/* Reports */}
      <Route
        path="/reports/sales"
        element={
          <ProtectedRoute>
            <SalesReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/itemwise"
        element={
          <ProtectedRoute>
            <ItemwiseSales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/userwise"
        element={
          <ProtectedRoute adminOnly>
            <UserwiseSales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/daily-collection"
        element={
          <ProtectedRoute>
            <DailyCollection />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/purchases"
        element={
          <ProtectedRoute adminOnly>
            <PurchaseSummary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/stock"
        element={
          <ProtectedRoute adminOnly>
            <StockReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/profit"
        element={
          <ProtectedRoute adminOnly>
            <ProfitReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/suppliers"
        element={
          <ProtectedRoute adminOnly>
            <SupplierReport />
          </ProtectedRoute>
        }
      />

      {/* Settings - Admin Only */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute adminOnly>
            <BusinessSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/company"
        element={
          <ProtectedRoute adminOnly>
            <CompanyProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/homepage"
        element={
          <ProtectedRoute adminOnly>
            <HomepageManager />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#667eea',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
