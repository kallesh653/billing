import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Button } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  UserOutlined,
  ArrowUpOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  TeamOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import Layout from '../common/Layout';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [invoiceStats, setInvoiceStats] = useState({});
  const [salesData, setSalesData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [todaySummary, lowStock, bills, invoices] = await Promise.all([
        api.get('/bills/summary/today'),
        api.get('/subcodes/alerts/low-stock'),
        api.get('/bills?limit=5'),
        api.get('/invoices/stats')
      ]);

      setStats(todaySummary.data.summary);
      setLowStockItems(lowStock.data.items || []);
      setRecentBills(bills.data.bills || []);
      setInvoiceStats(invoices.data.data || {});

      // Prepare sales data for last 7 days
      prepareSalesChartData();
      preparePaymentChartData(stats);
    } catch (error) {
      // Dashboard data fetch failed - will show empty state
    } finally {
      setLoading(false);
    }
  };

  const prepareSalesChartData = () => {
    // Generate mock data for last 7 days (you can replace with real API data)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map((day, index) => ({
      name: day,
      sales: Math.floor(Math.random() * 5000) + 2000,
      purchases: Math.floor(Math.random() * 3000) + 1000,
      invoices: Math.floor(Math.random() * 4000) + 1500
    }));
    setSalesData(data);
  };

  const preparePaymentChartData = (stats) => {
    const data = [
      { name: 'Cash', value: stats.cash || 0, color: '#667eea' },
      { name: 'Card', value: stats.card || 0, color: '#f093fb' },
      { name: 'UPI', value: stats.upi || 0, color: '#4facfe' },
      { name: 'Credit', value: stats.credit || 0, color: '#fa709a' }
    ];
    setPaymentData(data.filter(item => item.value > 0));
  };

  const statCards = [
    {
      title: "Today's Sales",
      value: stats.totalSales || 0,
      prefix: '₹',
      icon: <DollarOutlined />,
      color: '#667eea'
    },
    {
      title: "Today's Invoices",
      value: invoiceStats.totalInvoices || 0,
      icon: <FileTextOutlined />,
      color: '#f093fb',
      suffix: ''
    },
    {
      title: 'Pending Amount',
      value: invoiceStats.pendingAmount || 0,
      prefix: '₹',
      icon: <ShoppingOutlined />,
      color: '#ff4d4f'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers || 0,
      icon: <TeamOutlined />,
      color: '#4facfe'
    }
  ];

  const columns = [
    {
      title: 'Bill No',
      dataIndex: 'billNo',
      key: 'billNo',
      render: (text) => <strong style={{ color: '#667eea' }}>{text}</strong>
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName'
    },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (amount) => <strong>₹{amount?.toFixed(2)}</strong>
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: (mode) => <Tag color="blue">{mode}</Tag>
    },
    {
      title: 'Time',
      dataIndex: 'billDate',
      key: 'billDate',
      render: (date) => new Date(date).toLocaleTimeString()
    }
  ];

  const lowStockColumns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Sub Code',
      dataIndex: 'subCode',
      key: 'subCode'
    },
    {
      title: 'Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (stock, record) => (
        <Tag color={stock <= record.minStockAlert ? 'red' : 'orange'}>
          {stock} {record.unit}
        </Tag>
      )
    },
    {
      title: 'Min Alert',
      dataIndex: 'minStockAlert',
      key: 'minStockAlert'
    }
  ];

  return (
    <Layout>
      <div>
        <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
          Admin Dashboard
        </h1>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          {statCards.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                className="stat-card fade-in"
                style={{
                  background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}dd 100%)`,
                  border: 'none',
                  color: 'white',
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 10 }}>{stat.icon}</div>
                <Statistic
                  title={<span style={{ color: 'white', fontSize: 14 }}>{stat.title}</span>}
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  valueStyle={{ color: 'white', fontSize: 32, fontWeight: 600 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Charts Section */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* Sales vs Purchase Trend */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart style={{ fontSize: 20, color: '#667eea' }} />
                  <span>Sales & Purchase Trends (Last 7 Days)</span>
                </div>
              }
              style={{ borderRadius: 12 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f093fb" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f093fb" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorInvoice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4facfe" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4facfe" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#667eea"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    name="Sales (₹)"
                  />
                  <Area
                    type="monotone"
                    dataKey="purchases"
                    stroke="#f093fb"
                    fillOpacity={1}
                    fill="url(#colorPurchase)"
                    name="Purchases (₹)"
                  />
                  <Area
                    type="monotone"
                    dataKey="invoices"
                    stroke="#4facfe"
                    fillOpacity={1}
                    fill="url(#colorInvoice)"
                    name="Invoices (₹)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          {/* Payment Mode Distribution */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PieChart style={{ fontSize: 20, color: '#667eea' }} />
                  <span>Payment Distribution</span>
                </div>
              }
              style={{ borderRadius: 12 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Recent Activity */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileTextOutlined style={{ fontSize: 20, color: '#667eea' }} />
                  <span>Recent Bills</span>
                </div>
              }
              extra={
                <Button type="link" onClick={() => navigate('/billing/view-bills')}>
                  View All
                </Button>
              }
              style={{ borderRadius: 12 }}
            >
              <Table
                dataSource={recentBills}
                columns={columns}
                rowKey="_id"
                pagination={false}
                size="small"
                locale={{ emptyText: 'No recent bills' }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <WarningOutlined style={{ color: '#fa709a', fontSize: 20 }} />
                  <span>Low Stock Alert</span>
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/stock')}>
                  View Stock
                </Button>
              }
              style={{ borderRadius: 12 }}
            >
              <Table
                dataSource={lowStockItems.slice(0, 5)}
                columns={lowStockColumns}
                rowKey="_id"
                pagination={false}
                size="small"
                locale={{ emptyText: 'No low stock items' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card
              title="Quick Actions"
              style={{ borderRadius: 12 }}
            >
              <Space wrap size="middle">
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => navigate('/invoices/create')}
                >
                  Create Invoice
                </Button>
                <Button
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => navigate('/billing/take-order')}
                >
                  Quick Sale (POS)
                </Button>
                <Button
                  size="large"
                  icon={<ShoppingOutlined />}
                  onClick={() => navigate('/purchase/add')}
                >
                  Add Purchase
                </Button>
                <Button
                  size="large"
                  icon={<FileTextOutlined />}
                  onClick={() => navigate('/reports/sales')}
                >
                  View Reports
                </Button>
                <Button
                  size="large"
                  icon={<TeamOutlined />}
                  onClick={() => navigate('/masters/customers')}
                >
                  Manage Customers
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
