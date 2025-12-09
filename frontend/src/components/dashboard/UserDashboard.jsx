import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Button, Table, Tag } from 'antd';
import { DollarOutlined, FileTextOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [stats, setStats] = useState({});
  const [recentBills, setRecentBills] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summary, bills] = await Promise.all([
        api.get('/bills/summary/today'),
        api.get('/bills?limit=10')
      ]);

      setStats(summary.data.summary);
      setRecentBills(bills.data.bills || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const columns = [
    { title: 'Bill No', dataIndex: 'billNo', key: 'billNo' },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (name) => name || '-'
    },
    {
      title: 'Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (amount) => `₹${amount?.toFixed(2)}`
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
      render: (date) => new Date(date).toLocaleString()
    }
  ];

  return (
    <Layout>
      <div>
        <h1 style={{ marginBottom: 24, fontSize: 28, fontWeight: 600 }}>
          Cashier Dashboard
        </h1>
        <p style={{ marginTop: -15, marginBottom: 24, color: '#666' }}>
          Welcome! Start taking orders and manage your sales.
        </p>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card className="stat-card gradient-primary">
              <Statistic
                title={<span style={{ color: 'white' }}>Today's Sales</span>}
                value={stats.totalSales || 0}
                prefix="₹"
                valueStyle={{ color: 'white', fontSize: 32 }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card className="stat-card gradient-success">
              <Statistic
                title={<span style={{ color: 'white' }}>Today's Bills</span>}
                value={stats.totalBills || 0}
                valueStyle={{ color: 'white', fontSize: 32 }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card className="stat-card gradient-info">
              <Statistic
                title={<span style={{ color: 'white' }}>Cash Collection</span>}
                value={stats.cash || 0}
                prefix="₹"
                valueStyle={{ color: 'white', fontSize: 32 }}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title="Quick Actions"
          style={{ marginTop: 24 }}
        >
          <Button
            type="primary"
            size="large"
            icon={<ShoppingCartOutlined />}
            onClick={() => navigate('/billing/take-order')}
            style={{ marginRight: 16 }}
          >
            Take New Order
          </Button>
          <Button
            size="large"
            icon={<FileTextOutlined />}
            onClick={() => navigate('/billing/view-bills')}
          >
            View My Bills
          </Button>
        </Card>

        <Card title="Recent Bills" style={{ marginTop: 24 }}>
          <Table
            dataSource={recentBills}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </Layout>
  );
};

export default UserDashboard;
